import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

let app: INestApplication;

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule);

  nestApp.use(cookieParser());
  nestApp.enableCors({
    origin: true, // Allow all origins in development (configure for production)
    credentials: true, // Allow cookies to be sent
  });
  
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  await nestApp.init();
  return nestApp;
}

export default async (req, res) => {
  if (!app) {
    app = await bootstrap();
  }
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
};
