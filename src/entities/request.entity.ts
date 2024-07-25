import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OperationEntity } from './operation.entity';
import { TaskEntity } from './task.entity';

@Entity()
export class RequestEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    requestId: string;

    @Column()
    requester: string;

    @OneToMany(() => OperationEntity, (operation) => operation.request, { cascade: true })
    ops: OperationEntity[];

    @Column('bigint')
    opsCursor: number;

    @Column()
    callbackAddr: string;

    @Column()
    callbackFunc: string;

    @Column('text')
    extraData: string;

    @OneToMany(() => TaskEntity, (task) => task.request)
    tasks: TaskEntity[];
}
