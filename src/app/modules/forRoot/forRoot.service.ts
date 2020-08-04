import { Inject, Injectable } from '@nestjs/common';
import { MappedException } from '../../..';
import { HttpException } from '../http/http.exception';
import { ForRootException } from './forRoot.exception';

@Injectable()
export class ForRootService {
  constructor(
    @Inject('ForRootException')
    private readonly forRootException: MappedException<ForRootException>,
    @Inject('HttpException')
    private readonly httpException: MappedException<HttpException>,
  ) {}

  throwForRootError() {
    this.forRootException.ERRORS.NOT_FOUND.throw();
  }

  throwHttpError() {
    this.httpException.ERRORS.NOT_FOUND.throw();
  }
}
