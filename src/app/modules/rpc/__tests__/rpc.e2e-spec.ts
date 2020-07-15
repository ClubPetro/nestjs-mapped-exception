import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Repository } from 'typeorm';
import { MappedExceptionModule } from '../../../../core';
import ormConfig from '../../../ormconfig';
import { User } from '../../user/user.entity';
import { RpcException } from '../rpc.exception';
import { RpcModule } from '../rpc.module';
import { RpcService } from '../rpc.service';

let app: NestFastifyApplication;
let repository: Repository<User>;

describe('Rpc Module (e2e)', () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        RpcModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
          useFactory: () => ormConfig,
        }),
        MappedExceptionModule.forFeature(RpcException, {
          prefix: 'RPC_ERROR',
        }),
      ],
      providers: [
        RpcService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'grpcpackage',
        protoPath: join(__dirname, '../rpc.proto'),
        url: '127.0.0.1:5001',
      },
    });

    await app.startAllMicroservicesAsync();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    repository = module.get<Repository<User>>(getRepositoryToken(User));

    await app.init();
  });

  beforeAll(async () => {
    await repository.delete({});
    await repository.save({
      name: 'Jhow',
      email: 'jhow@jhow.com',
      age: 29,
    });
  });

  describe('Testing HTTP errors', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });

    /*
    it('should get database error', async () => {
      return await app
        .inject({
          method: 'GET',
          url: `/http/database-error`,
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_DATABASE_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
    */

    /*
    it('should get validation error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/http/create`,
          payload: {},
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_VALIDATION_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    it('should get validation error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/http/create`,
          payload: {
            email: 'test',
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_VALIDATION_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    it('should get database error (user already exists)', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/http/create`,
          payload: {
            name: 'Jhow',
            email: 'jhow@jhow.com',
            age: 30,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_DATABASE_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    it('should get application error', async () => {
      return await app
        .inject({
          method: 'GET',
          url: `/http/application-error`,
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    it('should get exception error', async () => {
      return await app
        .inject({
          method: 'GET',
          url: `/http/exception-error`,
        })
        .then((response: any) => {
          const exception = new RpcException();
          expect(response.statusCode).toBe(exception.NOT_FOUND.statusCode);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(
            `HTTP_ERROR${exception.NOT_FOUND.code
              .toString()
              .padStart(4, '0')}RPC`,
          );
          expect(body.statusCode).toBe(exception.NOT_FOUND.statusCode);
        });
    });

    it('should get http exception error', async () => {
      return await app
        .inject({
          method: 'GET',
          url: `/http/http-exception`,
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
          const body = JSON.parse(response.body);
          expect(body.code).toBe(process.env.EXCEPTION_ERROR_PREFIX);
          expect(body.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
        });
    });
    */
  });
});
