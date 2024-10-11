import {Entity, Column, OneToMany, PrimaryColumn} from 'typeorm';
import { TaskEntity } from './task.entity';

@Entity()
export class OracleSvcEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    chainId: number;

    @Column()
    address: string;

    @OneToMany(() => TaskEntity, (task) => task.oracleSvc)
    tasks: TaskEntity[];
}
