import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellInvoiceProduct } from './sell-invoice-product.entity';

export enum InvoiceType {
  CASH = 'cash',
  CREDIT = 'credit',
}

@Entity()
export class SellInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  sellDate: Date;

  @Column()
  tax: number;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerPhoneNumber: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.CASH,
  })
  type: InvoiceType;

  @OneToMany(
    () => SellInvoiceProduct,
    (sellInvoiceProduct) => sellInvoiceProduct.sellInvoice,
    { cascade: true },
  )
  products: SellInvoiceProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  modifiedAt: Date;
}
