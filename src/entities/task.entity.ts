import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { RequestEntity } from './request.entity';

@Entity()
export class TaskEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requestId: string;

    @Column()
    requester: string;

    @Column()
    transactionHash: string;

    @Column()
    blockHash: string;

    @Column()
    chainId: number;

    @Column({ default: 'pending' })
    status: string;

    @Column()
    callbackAddr: string;

    @Column()
    callbackFunc: string;

    @Column('text')
    extraData: string;

    @ManyToOne(() => RequestEntity, (request) => request.tasks)
    request: RequestEntity;

    @Column('text', { nullable: true }) // JSON Wrapped
    responseResults: string;

    @Column('text', {nullable: true})
    callbackRecipient: string;
}
