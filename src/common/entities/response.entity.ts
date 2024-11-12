import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity';
import { bigintFromJSON, bigintToJSON } from '../utils';

@Entity()
export class ResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reqId: string;

  @Column({
    type: 'json',
    transformer: {
      to: function (obj_with_bigint: any) {
        return JSON.parse(JSON.stringify(obj_with_bigint, bigintToJSON));
      },
      from: function (obj_without_bigint: any) {
        return JSON.parse(JSON.stringify(obj_without_bigint), bigintFromJSON);
      },
    },
  })
  body: any;

  @OneToMany(() => TaskEntity, (task) => task.response)
  tasks: TaskEntity[];
}

@Entity()
export class AsyncResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reqIdAsync: number;

  @Column()
  transactionHash: string;

  @Column({ nullable: true })
  transactionHashAsync: string;

  @Column({
    type: 'json',
    transformer: {
      to: function (obj_with_bigint: any) {
        return JSON.parse(JSON.stringify(obj_with_bigint, bigintToJSON));
      },
      from: function (obj_without_bigint: any) {
        return JSON.parse(JSON.stringify(obj_without_bigint), bigintFromJSON);
      },
    },
  })
  body: any;

  @ManyToOne(() => TaskEntity, (task) => task.asyncResponses)
  task: TaskEntity;
}
