import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { RequestEntity } from './request.entity';

@Entity()
export class OperationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    opcode: number;

    @Column('simple-array')
    operands: number[];

    @Column('bigint')
    value: number;

    @Column()
    index: number;

    @ManyToOne(() => RequestEntity, (request) => request.ops)
    request: RequestEntity;
}
