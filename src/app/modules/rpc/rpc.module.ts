import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { MappedExceptionModule } from '../../../core';
import { User } from '../user/user.entity';
import { RpcController } from './rpc.controller';
import { RpcException } from './rpc.exception';
import { RpcService } from './rpc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MappedExceptionModule.forFeature(RpcException, {
      prefix: 'RPC_ERROR',
    }),
    ClientsModule.register([
      {
        name: 'GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'grpcpackage',
          protoPath: join(__dirname, './rpc.proto'),
          url: '127.0.0.1:5001',
        },
      },
    ]),
  ],
  controllers: [RpcController, RpcService],
  providers: [RpcService],
})
export class RpcModule {}
