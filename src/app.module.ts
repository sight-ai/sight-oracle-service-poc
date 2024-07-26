import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import {GatewayModule} from "./gateway/gateway.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    GatewayModule,
    TaskModule],
  providers: [AppService],
})
export class AppModule {}
