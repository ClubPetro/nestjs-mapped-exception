import {
  Controller,
  HttpException as NestHttpException,
  HttpStatus,
  Injectable,
  UseFilters,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappedException, MappedExceptionFilter } from '../../../core';
import { User } from '../user/user.entity';
import { RpcException } from './rpc.exception';

@Controller()
@UseFilters(new MappedExceptionFilter())
@Injectable()
export class RpcService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly exception: MappedException<RpcException>,
  ) {}

  @GrpcMethod('RpcService', 'databaseError')
  async databaseError() {
    return await this.repository.findOne('uuid');
  }

  @GrpcMethod('RpcService', 'create')
  async create(data: User) {
    const created = this.repository.create(data);
    return await this.repository.save(created);
  }

  @GrpcMethod('RpcService', 'applicationError')
  async applicationError() {
    throw new Error('This is an application error');
  }

  @GrpcMethod('RpcService', 'exceptionError')
  async exceptionError() {
    this.exception.ERRORS.NOT_FOUND.throw();
  }

  @GrpcMethod('RpcService', 'httpException')
  async httpException() {
    throw new NestHttpException(
      'Testing HTTP exception',
      HttpStatus.I_AM_A_TEAPOT,
    );
  }
}
