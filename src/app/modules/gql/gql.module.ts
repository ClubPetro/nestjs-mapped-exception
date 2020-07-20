import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MappedExceptionModule } from '../../..';
import { User } from '../user/user.entity';
import { GqlException } from './gql.exception';
import { GqlResolver } from './gql.resolver';
import { GqlService } from './gql.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MappedExceptionModule.forFeature(GqlException, {
      prefix: 'GQL_ERROR',
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      debug: false,
      context: ({ req }) => ({ req }),
      formatError: (err) => {
        if (err.extensions?.exception) {
          return { ...err, code: err?.extensions?.exception?.response?.code };
        }
        return err;
      },
    }),
  ],
  providers: [GqlService, GqlResolver],
})
export class GqlModule {}
