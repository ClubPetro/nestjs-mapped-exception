import { Module } from '@nestjs/common';
import { MappedExceptionModule } from '../../..';
import { HttpException } from '../http/http.exception';
import { ForRootController } from './forRoot.controller';
import { ForRootException } from './forRoot.exception';
import { ForRootService } from './forRoot.service';

@Module({
  imports: [
    MappedExceptionModule.forRoot([ForRootException, HttpException], {
      prefix: 'APP_ERROR',
    }),
  ],
  controllers: [ForRootController],
  providers: [ForRootService],
})
export class ForRootModule {}
