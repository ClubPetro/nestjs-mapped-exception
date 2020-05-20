import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import { DEFAULT_EXCEPTIONS } from '../core/mapped-exception.errors';
import { MappedExceptionError } from '../core/mapped-exception-error.class';

@Catch()
export class MappedExceptionFilter implements ExceptionFilter {
  defaultExceptionCode: string = DEFAULT_EXCEPTIONS.DEFAULT.code.toString();

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const {
      status = HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code,
    } = this.getStatusAndMessage(exception);

    const contextType = host.getType();

    if (contextType === 'http') {
      return this.handleRestContext(request, response, status, message, code);
    } else if (contextType === 'rpc') {
      return this.handleRpcContext(code, message);
    }
  }

  private getStatusAndMessage(
    exception,
  ): { status: number; message: string; code: string } {
    if (exception instanceof MappedExceptionError) {
      const { code, message, statusCode } = exception.exception;
      return {
        code: code.toString(),
        message: `${message}`,
        status: statusCode,
      };
    } else if (exception instanceof HttpException) {
      return {
        code: this.getCodeFromHttpException(exception),
        message: exception.message,
        status: exception.getStatus(),
      };
    } else {
      return {
        code: this.defaultExceptionCode,
        message: exception.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  private handleRestContext(
    request: any,
    response: any,
    status: number,
    message: string,
    code: string,
  ) {
    return response.code(status).send({
      message,
      statusCode: status,
      code: code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleRpcContext(code: string, message: string = ''): any {
    return throwError(new Error(`${message} [${code}]`));
  }

  private getCodeFromHttpException(exception: HttpException): string {
    if (exception instanceof BadRequestException) {
      return DEFAULT_EXCEPTIONS.VALIDATION.DEFAULT.code.toString();
    } else {
      return this.defaultExceptionCode;
    }
  }
}
