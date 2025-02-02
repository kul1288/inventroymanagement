import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellInvoiceService } from './sell-invoice.service';
import { SellInvoiceController } from './sell-invoice.controller';
import { SellInvoice } from './sell-invoice.entity';
import { SellInvoiceProduct } from './sell-invoice-product.entity';
import { Product } from '../product/product.entity';
import { PurchaseInvoiceProduct } from '../purchase-invoice/purchase-invoice-product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SellInvoice, SellInvoiceProduct, Product, PurchaseInvoiceProduct])],
    providers: [SellInvoiceService],
    controllers: [SellInvoiceController],
})
export class SellInvoiceModule { }
