import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import { QueryFailedError } from 'typeorm';
import { MappedExceptionError } from '../mapped-exception-error.class';

enum ErrorLayerEnum {
  DATABASE,
  VALIDATION,
  APPLICATION,
  EXCEPTION,
}

@Catch()
export class MappedExceptionFilter implements ExceptionFilter {
  private defaultApplicationErrorPrefix =
    process.env.EXCEPTION_ERROR_PREFIX || 'APPLICATION_ERR';

  private defaultDatabaseErrorPrefix =
    process.env.EXCEPTION_DATABASE_ERROR_PREFIX || 'DATABASE_ERR';

  private defaultValidationErrorPrefix =
    process.env.EXCEPTION_VALIDATION_ERROR_PREFIX || 'VALIDATION_ERR';

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
    const errorLayer = this.identifyErrorLayer(exception);

    if (errorLayer === ErrorLayerEnum.DATABASE) {
      return {
        code: this.defaultDatabaseErrorPrefix,
        message: exception.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    if (errorLayer === ErrorLayerEnum.VALIDATION) {
      return {
        code: this.defaultValidationErrorPrefix,
        message: exception.message,
        status: HttpStatus.BAD_REQUEST,
      };
    }

    if (errorLayer === ErrorLayerEnum.EXCEPTION) {
      const { code, message, statusCode } = exception.exception;
      return {
        code: code.toString(),
        message,
        status: statusCode,
      };
    }

    if (errorLayer === ErrorLayerEnum.APPLICATION) {
      if (exception instanceof HttpException) {
        return {
          code: this.defaultApplicationErrorPrefix,
          message: exception.message,
          status: exception.getStatus(),
        };
      }

      return {
        code: this.defaultApplicationErrorPrefix,
        message: exception.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    // if (errorLayer === ErrorLayerEnum.APPLICATION) {
    //   return {
    //     code: this.defaultApplicationErrorPrefix,
    //     message: exception.message,
    //     status: HttpStatus.INTERNAL_SERVER_ERROR,
    //   };
    // }

    // if (
    //   exception instanceof MappedExceptionError ||
    //   exception.constructor.name === 'MappedExceptionError' // This is used for graphql reasons
    // ) {
    //   const { code, message, statusCode } = exception.exception;
    //   return {
    //     code: code.toString(),
    //     message: `${message}`,
    //     status: statusCode,
    //   };
    // }

    // if (
    //   exception instanceof HttpException ||
    //   exception.constructor.name === 'HttpException' // This is used for graphql reasons
    // ) {
    //   return {
    //     code: this.getCodeFromHttpException(exception),
    //     message: Array.isArray(exception.message)
    //       ? exception.message.join('; ')
    //       : exception.message,
    //     status: exception.getStatus(),
    //   };
    // }

    /*
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
    */
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

  // private getCodeFromHttpException(exception: HttpException): string {
  //   if (exception instanceof BadRequestException) {
  //     return DEFAULT_EXCEPTIONS.VALIDATION.DEFAULT.code.toString();
  //   }
  //   return DEFAULT_EXCEPTIONS.DEFAULT.code.toString();
  // }

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

  private identifyErrorLayer(exception): ErrorLayerEnum {
    if (exception instanceof QueryFailedError) {
      return ErrorLayerEnum.DATABASE;
    }

    if (exception instanceof BadRequestException) {
      return ErrorLayerEnum.VALIDATION;
    }

    if (exception instanceof MappedExceptionError) {
      return ErrorLayerEnum.EXCEPTION;
    }

    return ErrorLayerEnum.APPLICATION;
  }
}
