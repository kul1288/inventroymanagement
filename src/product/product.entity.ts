import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    partNo: string;

    @Column()
    name: string;

    @Column()
    unit: string;

    @Column()
    currentStock: number;

    @Column()
    lastPurchasePrice: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    modifiedAt: Date;
}
