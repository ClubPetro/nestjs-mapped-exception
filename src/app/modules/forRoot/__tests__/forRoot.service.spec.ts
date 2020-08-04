import { Test, TestingModule } from '@nestjs/testing';
import { MappedExceptionError, MappedExceptionModule } from '../../../..';
import { HttpException } from '../../http/http.exception';
import { ForRootException } from '../forRoot.exception';
import { ForRootService } from '../forRoot.service';

describe('ForRootService', () => {
  let service: ForRootService;
  const forRootExceptionClass = new ForRootException();
  const httpExceptionClass = new HttpException();
  const prefixAppExceptionError = 'APP_ERROR_';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MappedExceptionModule.forRoot([ForRootException, HttpException], {
          prefix: prefixAppExceptionError,
        }),
      ],
      providers: [ForRootService],
    }).compile();

    service = module.get<ForRootService>(ForRootService);
  });

  it('should be defined', () => {
    expect(true).toBeDefined();
  });

  it('should get correct exception code from ForRootException', () => {
    try {
      service.throwForRootError();
    } catch (err) {
      const exceptionError: MappedExceptionError = err as MappedExceptionError;
      const errorCode = `${prefixAppExceptionError}${forRootExceptionClass.NOT_FOUND.code
        .toString()
        .padStart(4, '0')}${forRootExceptionClass.constructor.name
        .substr(0, 3)
        .toUpperCase()}`;
      expect(exceptionError.exception.code).toBe(errorCode);
    }
  });

  it('should get correct exception code from HttpException', () => {
    try {
      service.throwHttpError();
    } catch (err) {
      const exceptionError: MappedExceptionError = err as MappedExceptionError;
      const errorCode = `${prefixAppExceptionError}${httpExceptionClass.NOT_FOUND.code
        .toString()
        .padStart(4, '0')}${httpExceptionClass.constructor.name
        .substr(0, 3)
        .toUpperCase()}`;
      expect(exceptionError.exception.code).toBe(errorCode);
    }
  });
});
