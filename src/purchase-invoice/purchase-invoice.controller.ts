import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Delete,
  Param,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('purchase-invoices')
@UseGuards(JwtAuthGuard)
export class PurchaseInvoiceController {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) { }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceDto,
  ): Promise<PurchaseInvoice> {
    return this.purchaseInvoiceService.create(createPurchaseInvoiceDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<{ data: PurchaseInvoice[]; count: number }> {
    limit = limit || 10;
    return this.purchaseInvoiceService.findAll(page, limit, startDate, endDate);
  }

  @Get(':id')
  async findOneById(@Param('id') id: number): Promise<PurchaseInvoice> {
    return this.purchaseInvoiceService.findOneById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.purchaseInvoiceService.delete(id);
    return { message: 'Purchase invoice deleted successfully' };
  }
}
