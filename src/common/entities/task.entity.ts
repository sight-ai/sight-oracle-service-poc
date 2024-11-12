import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RequestEntity } from './request.entity';
import { AsyncResponseEntity, ResponseEntity } from './response.entity';

export enum RequestType {
  GeneralRequestType,
  ReencryptRequestType,
  SaveCiphertextRequestType,
  GeneralRequestTypeWithAsyncOps,
}

@Entity()
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RequestType,
    default: RequestType.GeneralRequestType,
  })
  requestType: RequestType;

  @ManyToOne(() => RequestEntity, (request) => request.tasks)
  request: RequestEntity;

  @ManyToOne(() => ResponseEntity, (response) => response.tasks)
  response: ResponseEntity;

  @OneToMany(() => AsyncResponseEntity, (asyncResponse) => asyncResponse.task)
  asyncResponses: AsyncResponseEntity[];

  @Column()
  oracleInstanceId: string;

  @Column()
  computeProxyInstanceId: string;

  @Column()
  transactionHash: string;

  @Column()
  blockHash: string;

  @Column()
  logIndex: number;

  @Column()
  transactionIndex: number;

  @Column({ type: 'bigint' })
  blockNumber: string;

  @Column({ nullable: true })
  executeTxHash: string;

  @Column({ type: 'simple-array' })
  executeTxHashs: string[];

  @Column({ nullable: true })
  callbackTxHash: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: false })
  failed: boolean;

  @Column({ default: false })
  asynced: boolean;
}
