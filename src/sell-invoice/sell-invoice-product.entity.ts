import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SellInvoice } from './sell-invoice.entity';
import { Product } from '../product/product.entity';

@Entity()
export class SellInvoiceProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => SellInvoice, sellInvoice => sellInvoice.products)
    @JoinColumn({ name: 'sellInvoiceId' })
    sellInvoice: SellInvoice;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    quantity: number;

    @Column()
    rate: number;

    @Column()
    discount: number;

    @Column({ default: 0 })
    returnedQuantity: number;
}
