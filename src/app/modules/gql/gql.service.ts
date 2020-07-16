import {
  HttpException as NestHttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappedException } from '../../../core';
import { User } from '../user/user.entity';
import { GqlException } from './gql.exception';

@Injectable()
export class GqlService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly exception: MappedException<GqlException>,
  ) {}

  async databaseError() {
    return await this.repository.findOne('uuid');
  }

  async create(data: User) {
    const created = this.repository.create(data);
    return await this.repository.save(created);
  }

  async applicationError() {
    throw new Error('This is an application error');
  }

  async exceptionError() {
    this.exception.ERRORS.NOT_FOUND.throw();
  }

  async httpException() {
    throw new NestHttpException(
      'Testing HTTP exception',
      HttpStatus.I_AM_A_TEAPOT,
    );
  }
}
