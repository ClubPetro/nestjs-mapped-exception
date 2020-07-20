import { Body, Controller, Get, Post, UseFilters } from '@nestjs/common';
import { MappedExceptionFilter } from '../../..';
import { User } from '../user/user.entity';
import { HttpService } from './http.service';

@Controller('http')
@UseFilters(MappedExceptionFilter)
export class HttpController {
  constructor(private readonly service: HttpService) {}

  @Get('database-error')
  async databaseError() {
    return await this.service.databaseError();
  }

  @Post('create')
  async create(@Body() data: User): Promise<User> {
    return await this.service.create(data);
  }

  @Get('application-error')
  async applicationError() {
    return await this.service.applicationError();
  }

  @Get('exception-error')
  async exceptionError() {
    return await this.service.exceptionError();
  }

  @Get('http-exception')
  async httpException() {
    return await this.service.httpException();
  }
}
