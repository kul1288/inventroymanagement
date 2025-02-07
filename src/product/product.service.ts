import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { partNo: createProductDto.partNo },
    });
    if (existingProduct) {
      throw new ConflictException('Part number must be unique');
    }
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Product[], count: number }> {
    const [data, count] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }, // Order by creation date in descending order
    });
    return { data, count };
  }

  async findByPartNo(partNo: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { partNo: Like(`${partNo}%`) },
    });
  }

  async findOneById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (updateProductDto.partNo && updateProductDto.partNo !== product.partNo) {
      const existingProduct = await this.productRepository.findOne({
        where: { partNo: updateProductDto.partNo },
      });
      if (existingProduct) {
        throw new ConflictException('Part number must be unique');
      }
    }
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async delete(id: number): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.productRepository.remove(product);
  }

  async findLowStockProducts(page: number = 1, limit: number = 10): Promise<{ data: Product[], count: number }> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.minimumQuantity IS NOT NULL')
      .andWhere('product.currentStock <= product.minimumQuantity')
      .orderBy('product.currentStock', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, count] = await query.getManyAndCount();
    return { data, count };
  }

  async getLowStockCount(): Promise<number> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.minimumQuantity IS NOT NULL')
      .andWhere('product.currentStock <= product.minimumQuantity')
      .getCount();
  }
}
