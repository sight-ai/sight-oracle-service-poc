import {forwardRef, Module} from '@nestjs/common';
import { TaskService } from './task.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TaskEntity} from "../entities/task.entity";
import {RequestEntity} from "../entities/request.entity";
import { OperationEntity } from 'src/entities/operation.entity';
import {ComputeProxyService} from "./compute-proxy.service";
import {GatewayModule} from "../gateway/gateway.module";
import { OracleInstanceService } from 'src/gateway/oracle-instance.service';
import { OracleInstanceEntity } from 'src/entities/oracle-instance.entity';
import { ComputeProxyListenerService } from './compute-proxy-listener.service';
import { ComputeProxyInstanceEntity } from 'src/entities/compute-proxy-instance.entity';
import { ComputeProxyInstanceService } from './compute-proxy-instance.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, RequestEntity, OperationEntity, OracleInstanceEntity, ComputeProxyInstanceEntity]),
    forwardRef(() => GatewayModule)],
  providers: [TaskService, ComputeProxyService, ComputeProxyInstanceService, OracleInstanceService, ComputeProxyListenerService],
  exports: [TaskService, ComputeProxyService, ComputeProxyListenerService]
})
export class TaskModule {}
