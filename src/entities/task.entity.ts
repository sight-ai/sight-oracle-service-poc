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

    // @ManyToOne(() => OracleInstanceEntity, (request) => request.tasks)
    @Column()
    oracleInstanceId: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({default: false})
    failed: boolean

    @Column()
    callbackAddr: string;

    @Column()
    callbackFunc: string;

    @Column('text')
    payload: string;

    @ManyToOne(() => RequestEntity, (request) => request.tasks)
    request: RequestEntity;

    @Column('text', { nullable: true }) // JSON Wrapped
    responseResults: string;

    @Column({ nullable: true })
    executeResponseHash: string;

    @Column('text', {nullable: true})
    callbackRecipient: string;
}
