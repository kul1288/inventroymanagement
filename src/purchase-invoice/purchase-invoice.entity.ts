import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';
import { PurchaseInvoiceProduct } from './purchase-invoice-product.entity';

export enum InvoiceType {
  CASH = 'cash',
  CREDIT = 'credit',
}

@Entity()
export class PurchaseInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  @Index()
  purchaseDate: Date;

  @Column()
  tax: number;

  @Column({
    type: 'enum',
    enum: InvoiceType,
  })
  type: InvoiceType;

  @OneToMany(
    () => PurchaseInvoiceProduct,
    (purchaseInvoiceProduct) => purchaseInvoiceProduct.purchaseInvoice,
    { cascade: true },
  )
  products: PurchaseInvoiceProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  modifiedAt: Date;
}
