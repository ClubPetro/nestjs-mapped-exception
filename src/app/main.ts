import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'grpcpackage',
      protoPath: join(__dirname, 'modules/rpc/rpc.proto'),
      url: '127.0.0.1:5001',
    },
  });

  await app.startAllMicroservicesAsync();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors();

  const port = +process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Running on port ${port}`);
}
bootstrap();
