import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('OPCR Commitment Service')
    .setDescription('PSS — OPCR Commitment Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('commitment/api/docs', app, SwaggerModule.createDocument(app, config));

  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/commitment/api/docs');
  });

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`commitment running → http://localhost:${port}`);
  console.log(`Swagger         → http://localhost:${port}/commitment/api/docs`);
}
bootstrap();
