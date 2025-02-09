import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { InvoiceType, SellInvoice } from './sell-invoice.entity';
import { SellInvoiceProduct } from './sell-invoice-product.entity';
import { CreateSellInvoiceDto } from './dto/create-sell-invoice.dto';
import { ReturnSellInvoiceDto } from './dto/return-sell-invoice.dto';
import { Product } from '../product/product.entity';
import { PurchaseInvoiceProduct } from '../purchase-invoice/purchase-invoice-product.entity';
import { ReturnHistory } from '../return-history/return-history.entity';

@Injectable()
export class SellInvoiceService {
    constructor(
        @InjectRepository(SellInvoice)
        private sellInvoiceRepository: Repository<SellInvoice>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private dataSource: DataSource,
    ) { }

    async create(
        createSellInvoiceDto: CreateSellInvoiceDto,
    ): Promise<SellInvoice> {
        const { customer, sellDate, tax, type, products } = createSellInvoiceDto;

        return await this.dataSource.transaction(async (manager) => {
            const sellInvoice = new SellInvoice();
            sellInvoice.customerName = customer.name;
            sellInvoice.customerPhoneNumber = customer.phoneNumber ?? '';
            sellInvoice.customerEmail = customer.email ?? '';
            sellInvoice.customerAddress = customer.address ?? '';
            sellInvoice.customerGstNo = customer.gstNo ?? '';

            // Add current time to sell date
            const date = new Date(sellDate);
            const now = new Date();
            date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            sellInvoice.sellDate = date;

            sellInvoice.tax = tax ? 18 : 0;
            sellInvoice.type = type;
            sellInvoice.products = [];

            for (const productDto of products) {
                const product = await manager.findOne(Product, {
                    where: { id: productDto.productId },
                });
                if (!product || product.currentStock < productDto.quantity) {
                    throw new BadRequestException(
                        'Insufficient stock for Part no ' + product?.partNo + ' (Product Id: ' + productDto.productId + ')',
                    );
                }

                let remainingQuantity = productDto.quantity;
                const purchaseInvoiceProducts = await manager.find(
                    PurchaseInvoiceProduct,
                    {
                        where: {
                            product: { id: productDto.productId },
                            remainingQuantity: Not(0),
                        },
                        order: { id: 'ASC' },
                    },
                );

                for (const purchaseInvoiceProduct of purchaseInvoiceProducts) {
                    if (remainingQuantity <= 0) break;

                    const deductQuantity = Math.min(
                        purchaseInvoiceProduct.remainingQuantity,
                        remainingQuantity,
                    );
                    purchaseInvoiceProduct.remainingQuantity -= deductQuantity;
                    remainingQuantity -= deductQuantity;
                    await manager.save(purchaseInvoiceProduct);
                }

                const sellInvoiceProduct = new SellInvoiceProduct();
                sellInvoiceProduct.product = { id: productDto.productId } as any;
                sellInvoiceProduct.quantity = productDto.quantity;
                sellInvoiceProduct.rate = productDto.rate;
                sellInvoiceProduct.discount = productDto.discount;
                sellInvoice.products.push(sellInvoiceProduct);

                product.currentStock -= productDto.quantity;
                await manager.save(product);
            }

            return await manager.save(sellInvoice);
        });
    }

    async delete(id: number): Promise<void> {
        return await this.dataSource.transaction(async (manager) => {
            const sellInvoice = await manager.findOne(SellInvoice, {
                where: { id },
                relations: ['products', 'products.product'],
            });
            if (!sellInvoice) {
                throw new NotFoundException('Sell invoice not found');
            }

            for (const sellInvoiceProduct of sellInvoice.products) {
                const product = await manager.findOne(Product, {
                    where: { id: sellInvoiceProduct.product.id },
                });
                if (product) {
                    product.currentStock += sellInvoiceProduct.quantity;
                    await manager.save(product);
                }

                const purchaseInvoiceProducts = await manager.find(
                    PurchaseInvoiceProduct,
                    {
                        where: { product: { id: sellInvoiceProduct.product.id } },
                        order: { id: 'DESC' },
                    },
                );

                let remainingQuantity = sellInvoiceProduct.quantity;
                for (const purchaseInvoiceProduct of purchaseInvoiceProducts) {
                    if (remainingQuantity <= 0) break;

                    const availableSpace =
                        purchaseInvoiceProduct.quantity -
                        purchaseInvoiceProduct.remainingQuantity;
                    const addQuantity = Math.min(availableSpace, remainingQuantity);
                    purchaseInvoiceProduct.remainingQuantity += addQuantity;
                    remainingQuantity -= addQuantity;
                    await manager.save(purchaseInvoiceProduct);
                }
            }

            await manager.remove(sellInvoice.products);
            await manager.remove(sellInvoice);
        });
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        startDate?: string,
        endDate?: string,
    ): Promise<{ data: SellInvoice[]; count: number }> {
        const query = this.sellInvoiceRepository
            .createQueryBuilder('sellInvoice')
            .leftJoinAndSelect('sellInvoice.products', 'products')
            .leftJoinAndSelect('products.product', 'product')
            .orderBy('sellInvoice.sellDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (startDate) {
            query.andWhere('sellInvoice.sellDate >= :startDate', { startDate });
        }

        if (endDate) {
            query.andWhere('sellInvoice.sellDate <= :endDate', { endDate });
        }

        const [data, count] = await query.getManyAndCount();
        return { data, count };
    }

    async returnProduct(
        returnSellInvoiceDto: ReturnSellInvoiceDto,
    ): Promise<void> {
        const { sellInvoiceId, products } = returnSellInvoiceDto;

        return await this.dataSource.transaction(async (manager) => {
            const sellInvoice = await manager.findOne(SellInvoice, {
                where: { id: sellInvoiceId },
                relations: ['products', 'products.product'],
            });
            if (!sellInvoice) {
                throw new NotFoundException('Sell invoice not found');
            }

            for (const returnProduct of products) {
                const sellInvoiceProduct = sellInvoice.products.find(
                    (p) => p.product.id === returnProduct.productId,
                );
                if (!sellInvoiceProduct) {
                    throw new NotFoundException(
                        `Product with ID ${returnProduct.productId} not found in sell invoice`,
                    );
                }

                if (
                    sellInvoiceProduct.returnedQuantity + returnProduct.quantity >
                    sellInvoiceProduct.quantity
                ) {
                    throw new BadRequestException(
                        'Returned quantity cannot be greater than sold quantity',
                    );
                }

                sellInvoiceProduct.returnedQuantity += returnProduct.quantity;
                await manager.save(sellInvoiceProduct);

                const product = await manager.findOne(Product, {
                    where: { id: sellInvoiceProduct.product.id },
                });
                if (product) {
                    product.currentStock += returnProduct.quantity;
                    await manager.save(product);
                }

                const purchaseInvoiceProducts = await manager.find(
                    PurchaseInvoiceProduct,
                    {
                        where: { product: { id: sellInvoiceProduct.product.id } },
                        order: { id: 'DESC' },
                    },
                );

                let remainingQuantity = returnProduct.quantity;
                for (const purchaseInvoiceProduct of purchaseInvoiceProducts) {
                    if (remainingQuantity <= 0) break;

                    const availableSpace =
                        purchaseInvoiceProduct.quantity -
                        purchaseInvoiceProduct.remainingQuantity;
                    const addQuantity = Math.min(availableSpace, remainingQuantity);
                    purchaseInvoiceProduct.remainingQuantity += addQuantity;
                    remainingQuantity -= addQuantity;
                    await manager.save(purchaseInvoiceProduct);
                }

                const returnHistory = new ReturnHistory();
                returnHistory.sellInvoice = sellInvoice;
                returnHistory.product = sellInvoiceProduct.product;
                returnHistory.quantityReturned = returnProduct.quantity;
                returnHistory.returnDate = new Date();
                returnHistory.reason = returnProduct.reason;
                await manager.save(returnHistory);
            }
        });
    }

    async listReturnHistory(
        page: number = 1,
        limit: number = 10,
        startDate?: string,
        endDate?: string,
    ): Promise<{ data: ReturnHistory[]; count: number }> {
        const query = this.dataSource
            .getRepository(ReturnHistory)
            .createQueryBuilder('returnHistory')
            .leftJoinAndSelect('returnHistory.sellInvoice', 'sellInvoice')
            .leftJoinAndSelect('returnHistory.product', 'product')
            .orderBy('returnHistory.returnDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (startDate) {
            query.andWhere('returnHistory.returnDate >= :startDate', { startDate });
        }

        if (endDate) {
            query.andWhere('returnHistory.returnDate <= :endDate', { endDate });
        }

        const [data, count] = await query.getManyAndCount();
        return { data, count };
    }

    async getProfitReport(
        startDate: string,
        endDate: string,
    ): Promise<{
        totalPurchase: number;
        totalSell: number;
        totalReturn: number;
        totalProfit: number;
    }> {
        if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required');
        }

        const totalSellResult = await this.dataSource
            .getRepository(SellInvoice)
            .createQueryBuilder('sellInvoice')
            .select(
                'SUM(sellInvoiceProduct.quantity * sellInvoiceProduct.rate * (1 - sellInvoiceProduct.discount / 100))',
                'totalSell',
            )
            .leftJoin('sellInvoice.products', 'sellInvoiceProduct')
            .where('sellInvoice.sellDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .getRawOne();

        const totalPurchaseResult = await this.dataSource
            .getRepository(PurchaseInvoiceProduct)
            .createQueryBuilder('purchaseInvoiceProduct')
            .select(
                'SUM(purchaseInvoiceProduct.quantity * purchaseInvoiceProduct.rate)',
                'totalPurchase',
            )
            .leftJoin('purchaseInvoiceProduct.purchaseInvoice', 'purchaseInvoice')
            .where('purchaseInvoice.purchaseDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .getRawOne();

        const totalReturnResult = await this.dataSource
            .getRepository(ReturnHistory)
            .createQueryBuilder('returnHistory')
            .select(
                'SUM(returnHistory.quantityReturned * sellInvoiceProduct.rate * (1 - sellInvoiceProduct.discount / 100))',
                'totalReturn',
            )
            .leftJoin('returnHistory.sellInvoice', 'sellInvoice')
            .leftJoin('sellInvoice.products', 'sellInvoiceProduct')
            .where('returnHistory.returnDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .getRawOne();

        const totalSell = parseFloat(totalSellResult.totalSell) || 0;
        const totalPurchase = parseFloat(totalPurchaseResult.totalPurchase) || 0;
        const totalReturn = parseFloat(totalReturnResult.totalReturn) || 0;
        const totalProfit = totalSell - totalPurchase - totalReturn;

        return {
            totalPurchase,
            totalSell,
            totalReturn,
            totalProfit,
        };
    }

    async getTodaySalesReport(): Promise<{
        totalInvoices: number;
        totalAmountSold: number;
    }> {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        const totalInvoicesResult = await this.sellInvoiceRepository
            .createQueryBuilder('sellInvoice')
            .select('COUNT(sellInvoice.id)', 'totalInvoices')
            .where('sellInvoice.sellDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .getRawOne();

        const totalAmountSoldResult = await this.sellInvoiceRepository
            .createQueryBuilder('sellInvoice')
            .select(
                'SUM(sellInvoiceProduct.quantity * sellInvoiceProduct.rate * (1 - sellInvoiceProduct.discount / 100))',
                'totalAmountSold',
            )
            .leftJoin('sellInvoice.products', 'sellInvoiceProduct')
            .where('sellInvoice.sellDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .getRawOne();

        const totalInvoices = parseInt(totalInvoicesResult.totalInvoices, 10) || 0;
        const totalAmountSold =
            parseFloat(totalAmountSoldResult.totalAmountSold) || 0;

        return {
            totalInvoices,
            totalAmountSold,
        };
    }

    async getTodayCreditSales(): Promise<{ totalCreditSales: number }> {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const creditSalesResult = await this.sellInvoiceRepository
            .createQueryBuilder('sellInvoice')
            .select('SUM(sellInvoiceProduct.quantity * sellInvoiceProduct.rate * (1 - sellInvoiceProduct.discount / 100))', 'totalCreditSales')
            .leftJoin('sellInvoice.products', 'sellInvoiceProduct')
            .where('sellInvoice.sellDate BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('sellInvoice.type = :type', { type: InvoiceType.CREDIT })
            .getRawOne();

        return {
            totalCreditSales: parseFloat(creditSalesResult.totalCreditSales) || 0
        };
    }
}
