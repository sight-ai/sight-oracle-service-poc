import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../common/entities/task.entity';
import { RequestEntity } from '../common/entities/request.entity';
import { ComputeProxyService } from './compute-proxy.service';
import { GatewayModule } from '../gateway/gateway.module';
import { OracleInstanceService } from 'src/gateway/oracle-instance.service';
import { OracleInstanceEntity } from 'src/common/entities/oracle-instance.entity';
import { ComputeProxyListenerService } from './compute-proxy-listener.service';
import { ComputeProxyInstanceEntity } from 'src/common/entities/compute-proxy-instance.entity';
import { ComputeProxyInstanceService } from './compute-proxy-instance.service';
import {
  AsyncResponseEntity,
  ResponseEntity,
} from 'src/common/entities/response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      RequestEntity,
      ResponseEntity,
      AsyncResponseEntity,
      OracleInstanceEntity,
      ComputeProxyInstanceEntity,
    ]),
    forwardRef(() => GatewayModule),
  ],
  providers: [
    TaskService,
    ComputeProxyService,
    ComputeProxyInstanceService,
    OracleInstanceService,
    ComputeProxyListenerService,
  ],
  exports: [TaskService, ComputeProxyService, ComputeProxyListenerService],
})
export class TaskModule {}
