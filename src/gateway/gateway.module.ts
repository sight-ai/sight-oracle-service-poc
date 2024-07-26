import {forwardRef, Module} from '@nestjs/common';
import {OracleListenerService} from "./oracle-listener.service";
import {TaskModule} from "../task/task.module";
import {ConfigModule} from "@nestjs/config";
import {OracleCallbackService} from "./oracle-callback.service";

@Module({
    imports: [ConfigModule, forwardRef(() => TaskModule)],
    providers: [OracleListenerService, OracleCallbackService],
    exports: [OracleCallbackService]
})
export class GatewayModule {}
