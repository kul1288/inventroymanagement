import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { Product } from '../product/product.entity';

@Entity()
export class PurchaseInvoiceProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => PurchaseInvoice, purchaseInvoice => purchaseInvoice.products)
    @JoinColumn({ name: 'purchaseInvoiceId' })
    purchaseInvoice: PurchaseInvoice;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    quantity: number;

    @Column()
    rate: number;

    @Column()
    discount: number;

    @Column()
    remainingQuantity: number;
}
