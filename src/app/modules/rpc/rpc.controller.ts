import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { MappedExceptionFilter } from '../../../core';
import { User } from '../user/user.entity';

@Controller('rpc')
@UseFilters(MappedExceptionFilter)
export class RpcController implements OnModuleInit {
  private rpcService: any;

  constructor(@Inject('GRPC_CLIENT') private rpcClient: ClientGrpc) {}

  onModuleInit() {
    this.rpcService = this.rpcClient.getService('RpcService');
  }

  @Get('database-error')
  async databaseError() {
    return await this.rpcService.databaseError().toPromise();
  }

  @Post('create')
  async create(@Body() data: User): Promise<User> {
    return await this.rpcService.create(data).toPromise();
  }

  @Get('application-error')
  async applicationError() {
    return await this.rpcService.applicationError().toPromise();
  }

  @Get('exception-error')
  async exceptionError() {
    return await this.rpcService.exceptionError().toPromise();
  }

  @Get('http-exception')
  async httpException() {
    return await this.rpcService.httpException().toPromise();
  }
}
