import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TaskEntity} from "../entities/task.entity";
import {RequestEntity} from "../entities/request.entity";
import { OperationEntity } from 'src/entities/operation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, RequestEntity, OperationEntity])],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
