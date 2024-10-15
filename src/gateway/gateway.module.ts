import {forwardRef, Module} from '@nestjs/common';
import {OracleListenerService} from "./oracle-listener.service";
import {TaskModule} from "../task/task.module";
import {ConfigModule} from "@nestjs/config";
import {OracleCallbackService} from "./oracle-callback.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { OracleInstanceEntity } from 'src/entities/oracle-instance.entity';
import { OracleInstanceService } from './oracle-instance.service';

@Module({
    imports: [ConfigModule, forwardRef(() => TaskModule), TypeOrmModule.forFeature([OracleInstanceEntity])],
    providers: [OracleInstanceService, OracleListenerService, OracleCallbackService],
    exports: [OracleCallbackService]
})
export class GatewayModule {}
