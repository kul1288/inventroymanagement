import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SellInvoice } from '../sell-invoice/sell-invoice.entity';
import { Product } from '../product/product.entity';

@Entity()
export class ReturnHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SellInvoice)
  @JoinColumn({ name: 'sellInvoiceId' })
  sellInvoice: SellInvoice;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  quantityReturned: number;

  @CreateDateColumn()
  returnDate: Date;

  @Column({ nullable: true })
  reason?: string;
}
