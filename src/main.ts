import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }));

  const config = new DocumentBuilder()
    .setTitle('Digital Escrow API')
    .setDescription('Digital Escrow API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('api')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Digital Escrow API Docs',
  };

  SwaggerModule.setup('api/v1', app, document, customOptions);

  app.enableCors();

  await app.listen(process.env.PORT || 5000);

  console.log(`server running on ${await app.getUrl()} : ` + new Date());
}

bootstrap();
