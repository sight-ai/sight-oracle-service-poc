import { Module } from '@nestjs/common';
import {OracleListenerService} from "./oracle-listener.service";
import {TaskModule} from "../task/task.module";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [ConfigModule, TaskModule],
    providers: [OracleListenerService]
})
export class GatewayModule {}
