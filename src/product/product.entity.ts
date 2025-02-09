import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  partNo: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column()
  currentStock: number;

  @Column()
  lastPurchasePrice: number;

  @Column({ nullable: true })
  minimumQuantity: number;

  @Column({ nullable: true })
  commonName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  modifiedAt: Date;
}
