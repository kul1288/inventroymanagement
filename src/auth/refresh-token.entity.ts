import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    token: string;
}
