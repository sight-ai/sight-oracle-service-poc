import {forwardRef, Module} from '@nestjs/common';
import {OracleListenerService} from "./oracle-listener.service";
import {TaskModule} from "../task/task.module";
import {ConfigModule} from "@nestjs/config";
import {OracleCallbackService} from "./oracle-callback.service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { OracleSvcEntity } from 'src/entities/oracle-svc.entity';

@Module({
    imports: [ConfigModule, forwardRef(() => TaskModule), TypeOrmModule.forFeature([OracleSvcEntity])],
    providers: [OracleListenerService, OracleCallbackService],
    exports: [OracleCallbackService]
})
export class GatewayModule {}
