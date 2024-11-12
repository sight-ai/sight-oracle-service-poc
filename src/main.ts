import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  let loglevel: LogLevel;
  switch (process.env.LOGLEVEL || 'debug') {
    case 'log':
      loglevel = 'log';
      break;
    case 'error':
      loglevel = 'error';
      break;
    case 'warn':
      loglevel = 'warn';
      break;
    case 'debug':
      loglevel = 'debug';
      break;
    case 'verbose':
      loglevel = 'verbose';
      break;
    case 'fatal':
      loglevel = 'fatal';
      break;
    default:
      loglevel = 'debug';
  }
  const app = await NestFactory.create(AppModule, {
    logger: [loglevel],
  });
  await app.listen(3001);
}
bootstrap();
