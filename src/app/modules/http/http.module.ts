import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MappedExceptionModule } from '../../..';
import { User } from '../user/user.entity';
import { HttpController } from './http.controller';
import { HttpException } from './http.exception';
import { HttpService } from './http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MappedExceptionModule.forFeature(HttpException, {
      prefix: 'HTTP_ERROR',
    }),
  ],
  controllers: [HttpController],
  providers: [HttpService],
})
export class HttpModule {}
