import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.ENV !== 'production',
      logging: false,
    }),
    GatewayModule,
    TaskModule,
  ],
  providers: [AppService],
})
export class AppModule {}
