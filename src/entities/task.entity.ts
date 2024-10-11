import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { RequestEntity } from './request.entity';
import { OracleSvcEntity } from './oracle-svc.entity';

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

    @ManyToOne(() => OracleSvcEntity, (request) => request.tasks)
    oracleSvc: OracleSvcEntity;

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

    @Column('text', {nullable: true})
    callbackRecipient: string;
}
