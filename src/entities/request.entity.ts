import {Entity, PrimaryGeneratedColumn, Column, OneToMany, PrimaryColumn} from 'typeorm';
import { OperationEntity } from './operation.entity';
import { TaskEntity } from './task.entity';

@Entity()
export class RequestEntity {
    @PrimaryColumn()
    id: string;

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
    payload: string;

    @OneToMany(() => TaskEntity, (task) => task.request)
    tasks: TaskEntity[];
}
