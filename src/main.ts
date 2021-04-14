import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {v2} from 'cloudinary';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(
    app.get(Reflector))
  );

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }));

  app.setGlobalPrefix('api/v1');


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

  SwaggerModule.setup('api/v1/docs', app, document, customOptions);

  app.enableCors();

  const configService = app.get(ConfigService);
  v2.config({
      cloud_name: configService.get("CLOUDINARY_CLOUD_NAME"),
      api_key: configService.get("CLOUDINARY_API_KEY"),
      api_secret: configService.get("CLOUDINARY_API_SECRET")
  })
  
  await app.listen( process.env.PORT || 5000);

  console.log(`server running on ${await app.getUrl()} : ` + new Date());
}

bootstrap();
