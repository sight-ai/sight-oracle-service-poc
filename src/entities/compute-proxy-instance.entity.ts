import {Entity, Column, OneToMany, PrimaryColumn} from 'typeorm';

@Entity()
export class ComputeProxyInstanceEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    chainId: number;

    @Column()
    address: string;

    @Column({ type: 'bigint', default: 0, nullable: true })
    height: string
}
