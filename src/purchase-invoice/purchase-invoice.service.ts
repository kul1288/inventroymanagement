import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseInvoice, InvoiceType } from './purchase-invoice.entity';
import { PurchaseInvoiceProduct } from './purchase-invoice-product.entity';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { Product } from '../product/product.entity';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) { }

  async create(
    createPurchaseInvoiceDto: CreatePurchaseInvoiceDto,
  ): Promise<PurchaseInvoice> {
    const { vendorId, purchaseDate, tax, type, products } =
      createPurchaseInvoiceDto;

    return await this.dataSource.transaction(async (manager) => {
      const purchaseInvoice = new PurchaseInvoice();
      purchaseInvoice.vendor = { id: vendorId } as any;
      purchaseInvoice.purchaseDate = purchaseDate;
      purchaseInvoice.tax = tax ? 18 : 0;
      purchaseInvoice.type = type;
      purchaseInvoice.products = products.map((productDto) => {
        const purchaseInvoiceProduct = new PurchaseInvoiceProduct();
        purchaseInvoiceProduct.product = { id: productDto.productId } as any;
        purchaseInvoiceProduct.quantity = productDto.quantity;
        purchaseInvoiceProduct.remainingQuantity = productDto.quantity;
        purchaseInvoiceProduct.rate = productDto.rate;
        purchaseInvoiceProduct.discount = productDto.discount;
        return purchaseInvoiceProduct;
      });

      const savedInvoice = await manager.save(purchaseInvoice);

      for (const productDto of products) {
        const product = await manager.findOne(Product, {
          where: { id: productDto.productId },
        });
        if (product) {
          product.currentStock += productDto.quantity;
          product.lastPurchasePrice = productDto.rate;
          await manager.save(product);
        }
      }

      return savedInvoice;
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: PurchaseInvoice[]; count: number }> {
    const query = this.purchaseInvoiceRepository
      .createQueryBuilder('purchaseInvoice')
      .leftJoinAndSelect('purchaseInvoice.products', 'products')
      .leftJoinAndSelect('products.product', 'product')
      .orderBy('purchaseInvoice.purchaseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (startDate) {
      query.andWhere('purchaseInvoice.purchaseDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      query.andWhere('purchaseInvoice.purchaseDate <= :endDate', { endDate });
    }

    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  async findOneById(id: number): Promise<PurchaseInvoice> {
    const purchaseInvoice = await this.purchaseInvoiceRepository.findOne({
      where: { id },
      relations: ['products', 'products.product', 'vendor'],
    });
    if (!purchaseInvoice) {
      throw new NotFoundException('Purchase invoice not found');
    }
    return purchaseInvoice;
  }

  async delete(id: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseInvoice = await manager.findOne(PurchaseInvoice, {
        where: { id },
        relations: ['products', 'products.product'],
      });
      if (!purchaseInvoice) {
        throw new NotFoundException('Purchase invoice not found');
      }

      for (const product of purchaseInvoice.products) {
        if (product.remainingQuantity !== product.quantity) {
          throw new BadRequestException(
            'Cannot delete purchase invoice with products that have been partially used',
          );
        }
      }

      for (const product of purchaseInvoice.products) {
        const productEntity = await manager.findOne(Product, {
          where: { id: product.product.id },
        });
        if (productEntity) {
          productEntity.currentStock -= product.quantity;
          await manager.save(productEntity);
        }
      }

      await manager.remove(purchaseInvoice.products);
      await manager.remove(purchaseInvoice);
    });
  }
}
