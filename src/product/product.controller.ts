import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Product[], count: number }> {
    limit = limit > 10 ? 10 : limit;
    return this.productService.findAll(page, limit);
  }

  @Get('low-stock/count')
  async getLowStockCount(): Promise<{ count: number }> {
    const count = await this.productService.getLowStockCount();
    return { count };
  }

  @Get('low-stock')
  async getLowStockProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: Product[], count: number }> {
    limit = limit > 10 ? 10 : limit;
    return this.productService.findLowStockProducts(page, limit);
  }

  @Get('search')
  async findByPartNo(@Query('partNo') partNo: string): Promise<Product[]> {
    if (!partNo) {
      throw new BadRequestException('Part number query parameter is required');
    }
    return this.productService.findByPartNo(partNo);
  }

  @Get(':id')
  async findOneById(@Param('id') id: number): Promise<Product> {
    return this.productService.findOneById(id);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  )
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (
      !updateProductDto.partNo &&
      !updateProductDto.name &&
      !updateProductDto.unit &&
      updateProductDto.minimumQuantity === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.productService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
