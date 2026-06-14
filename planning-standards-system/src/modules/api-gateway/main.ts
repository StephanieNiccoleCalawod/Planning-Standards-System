import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('PSS API Gateway')
    .setDescription('Single entry point for the Planning Standards System — validates JWTs via ARMS and routes requests to PSS microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/api/docs');
  });

  const port = process.env.PORT ?? 4003;
  await app.listen(port);
  console.log(`PSS API Gateway running → http://localhost:${port}`);
  console.log(`Swagger                 → http://localhost:${port}/api/docs`);
}
bootstrap();
