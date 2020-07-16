import * as protoLoader from '@grpc/proto-loader';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import grpc from 'grpc';
import { join } from 'path';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { RpcException } from '../rpc.exception';
import { RpcModule } from '../rpc.module';
const RPC_URL = '127.0.0.1:5001';
const PROTO_PATH = join(__dirname, '../rpc.proto');

let app: any;
let rpcApp: any;
let repository: Repository<User>;
let rpcService: any;

describe('Rpc Module (e2e)', () => {
  beforeAll(async () => {
    rpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      RpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'grpcpackage',
          protoPath: PROTO_PATH,
          url: RPC_URL,
        },
      },
    );

    rpcApp.listen(() => console.log('RPC server listening'));

    const packageDefinition = protoLoader.loadSync(PROTO_PATH);
    const packageObject = grpc.loadPackageDefinition(packageDefinition)
      .grpcpackage as any;
    const packageService = packageObject.RpcService;
    rpcService = new packageService(RPC_URL, grpc.credentials.createInsecure());
  });

  describe('Testing HTTP errors', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });

    it('should get database error', (next) => {
      rpcService.databaseError({}, (err) => {
        expect(err).toBeDefined();
        expect(err.details).toEqual(
          expect.stringContaining(
            `[${process.env.EXCEPTION_DATABASE_ERROR_PREFIX}]`,
          ),
        );
        next();
      });
    });

    it('should get application error', (next) => {
      rpcService.applicationError({}, (err) => {
        expect(err).toBeDefined();
        expect(err.details).toEqual(
          expect.stringContaining(`[${process.env.EXCEPTION_ERROR_PREFIX}]`),
        );
        next();
      });
    });

    it('should get exception error', (next) => {
      const exception = new RpcException();
      rpcService.exceptionError({}, (err) => {
        expect(err).toBeDefined();
        expect(err.details).toEqual(
          expect.stringContaining(
            `[RPC_ERROR${exception.NOT_FOUND.code
              .toString()
              .padStart(4, '0')}RPC]`,
          ),
        );
        next();
      });
    });

    it('should get http exception error', (next) => {
      rpcService.httpException({}, (err) => {
        expect(err).toBeDefined();
        expect(err.details).toEqual(
          expect.stringContaining(`[${process.env.EXCEPTION_ERROR_PREFIX}]`),
        );
        next();
      });
    });
  });
});
