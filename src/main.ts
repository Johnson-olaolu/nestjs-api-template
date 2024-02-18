import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseDto } from './utils/Response.dto';
import metadata from './metadata';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./ssl/localhost.key'),
    cert: readFileSync('./ssl/localhost.crt'),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.enableCors({
    origin: true,
  });
  app.setGlobalPrefix(`api/${app.get(ConfigService).get('VERSION')}`);

  const config = new DocumentBuilder()
    .setTitle('GUIDELI API')
    .setDescription('GUIDELI API Documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
    })
    .build();
  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ResponseDto],
  });
  SwaggerModule.setup(
    `documentation/${app.get(ConfigService).get('VERSION')}`,
    app,
    document,
  );
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(app.get(ConfigService).get('PORT') || 3000);
}
bootstrap();
