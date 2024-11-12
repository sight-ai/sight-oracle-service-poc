import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { TaskEntity } from './task.entity';
import { bigintFromJSON, bigintToJSON } from '../utils';

@Entity()
export class RequestEntity {
  @PrimaryColumn()
  id: string;

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

  @OneToMany(() => TaskEntity, (task) => task.request)
  tasks: TaskEntity[];
}
