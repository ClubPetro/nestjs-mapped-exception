import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappedExceptionModule } from '../../../../core';
import ormConfig from '../../../ormconfig';
import { User } from '../../user/user.entity';
import { GqlException } from '../gql.exception';
import { GqlModule } from '../gql.module';
import { GqlService } from '../gql.service';

let app: NestFastifyApplication;
let repository: Repository<User>;

describe('Gql Module (e2e)', () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        GqlModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
          useFactory: () => ormConfig,
        }),
        MappedExceptionModule.forFeature(GqlException, {
          prefix: 'HTTP_ERROR',
        }),
      ],
      providers: [
        GqlService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    repository = module.get<Repository<User>>(getRepositoryToken(User));

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

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

    it('should get database error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              query {
                databaseError {
                  success
                }
              }
            `,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(
            process.env.EXCEPTION_DATABASE_ERROR_PREFIX,
          );
        });
    });

    it('should get validation error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              mutation {
                create(input: {name: "Jhow", email: "jhow", age: "29"}) {
                  name
                }
              }
            `,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(
            process.env.EXCEPTION_VALIDATION_ERROR_PREFIX,
          );
        });
    });

    it('should get database error (user already exists)', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              mutation {
                create(input: {name: "Jhow", email: "jhow@jhow.com", age: "29"}) {
                  name
                }
              }
            `,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(
            process.env.EXCEPTION_DATABASE_ERROR_PREFIX,
          );
        });
    });

    it('should get application error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              query {
                applicationError {
                  success
                }
              }
            `,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(process.env.EXCEPTION_ERROR_PREFIX);
        });
    });

    it('should get exception error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              query {
                exceptionError {
                  success
                }
              }
            `,
          },
        })
        .then((response: any) => {
          const exception = new GqlException();
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(
            `GQL_ERROR${exception.NOT_FOUND.code
              .toString()
              .padStart(4, '0')}GQL`,
          );
        });
    });

    it('should get http exception error', async () => {
      return await app
        .inject({
          method: 'POST',
          url: `/graphql`,
          payload: {
            query: `
              query {
                httpException {
                  success
                }
              }
            `,
          },
        })
        .then((response: any) => {
          expect(response.statusCode).toBe(HttpStatus.OK);
          const body = JSON.parse(response.body);
          expect(body.errors[0].code).toBe(process.env.EXCEPTION_ERROR_PREFIX);
        });
    });
  });
});
