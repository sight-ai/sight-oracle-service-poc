import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    {
      logger: process.env.LOGLEVEL ? process.env.LOGLEVEL === "log" ? ["log"] : ["debug"]: ["debug"]
    }
  );
  await app.listen(3001);
}
bootstrap();
