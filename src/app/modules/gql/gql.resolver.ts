import { UseFilters } from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { MappedExceptionFilter } from '../../..';
import { GqlService } from './gql.service';

@InputType()
export class CreateInput {
  @IsNotEmpty()
  @Field()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Field()
  email: string;

  @IsNotEmpty()
  @Field()
  age: string;
}

@ObjectType()
export class CreateType {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  age: number;
}

@ObjectType()
export class OkType {
  @Field()
  success: boolean;
}

@Resolver()
@UseFilters(MappedExceptionFilter)
export class GqlResolver {
  constructor(private readonly service: GqlService) {}

  @Query(() => OkType)
  async databaseError() {
    return await this.service.databaseError();
  }

  @Mutation(() => CreateType)
  async create(@Args('input') input: CreateInput) {
    return await this.service.create(input as any);
  }

  @Query(() => OkType)
  async applicationError() {
    return await this.service.applicationError();
  }

  @Query(() => OkType)
  async exceptionError() {
    return await this.service.exceptionError();
  }

  @Query(() => OkType)
  async httpException() {
    return await this.service.httpException();
  }
}
