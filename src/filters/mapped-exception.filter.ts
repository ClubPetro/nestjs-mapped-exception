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
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const {
      status = HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code,
    } = this.getStatusAndMessage(exception);

    const contextType: any = host.getType();

    if (contextType === 'http') {
      return this.handleRestContext(request, response, status, message, code);
    }

    if (contextType === 'rpc') {
      return this.handleRpcContext(code, message);
    }

    if (contextType === 'graphql') {
      return this.graphqlFormatError(status, message, code);
    }
  }

  private getStatusAndMessage(
    exception,
  ): { status: number; message: string; code: string } {
    if (
      exception instanceof MappedExceptionError ||
      exception.constructor.name === 'MappedExceptionError' // This is used for graphql reasons
    ) {
      const { code, message, statusCode } = exception.exception;
      return {
        code: code.toString(),
        message: `${message}`,
        status: statusCode,
      };
    }
    if (
      exception instanceof HttpException ||
      exception.constructor.name === 'HttpException' // This is used for graphql reasons
    ) {
      return {
        code: this.getCodeFromHttpException(exception),
        message: Array.isArray(exception.message)
          ? exception.message.join('; ')
          : exception.message,
        status: exception.getStatus(),
      };
    }

    let message = DEFAULT_EXCEPTIONS.VALIDATION.DEFAULT.message;
    if (exception.response && exception.response.message) {
      message = exception.response.message;
    } else if (exception.message) {
      message = exception.message;
    }

    let status = DEFAULT_EXCEPTIONS.DEFAULT.statusCode;
    if (exception.response && exception.response.statusCode) {
      status = exception.response.statusCode;
    } else if (exception.status) {
      status = exception.status;
    }

    let code = DEFAULT_EXCEPTIONS.DEFAULT.code.toString();
    if (exception.message && exception.message.indexOf('Bad Request') !== -1) {
      code = DEFAULT_EXCEPTIONS.VALIDATION.DEFAULT.code.toString();
    }

    return {
      code,
      message: Array.isArray(message) ? message.join('; ') : message,
      status: status,
    };
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
      code,
      statusCode: status,
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
    }
    return DEFAULT_EXCEPTIONS.DEFAULT.code.toString();
  }

  private graphqlFormatError(status: number, message: string, code: string) {
    return new HttpException(
      {
        message,
        code,
        statusCode: status,
      },
      status,
    );
  }
}
