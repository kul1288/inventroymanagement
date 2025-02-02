import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { PurchaseInvoiceController } from './purchase-invoice.controller';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { PurchaseInvoiceProduct } from './purchase-invoice-product.entity';
import { Product } from '../product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseInvoice,
      PurchaseInvoiceProduct,
      Product,
    ]),
  ],
  providers: [PurchaseInvoiceService],
  controllers: [PurchaseInvoiceController],
})
export class PurchaseInvoiceModule {}
