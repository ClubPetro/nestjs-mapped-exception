import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { status as GrpcStatus } from 'grpc';
import { throwError } from 'rxjs';
import { QueryFailedError } from 'typeorm';
import { isArray } from 'util';
import { MappedExceptionError } from '../mapped-exception-error.class';

enum ErrorLayerEnum {
  DATABASE,
  VALIDATION,
  APPLICATION,
  EXCEPTION,
}

const RpcStatusToHttpStatusMap = {
  [GrpcStatus.OK]: HttpStatus.OK,
  [GrpcStatus.CANCELLED]: HttpStatus.SERVICE_UNAVAILABLE,
  [GrpcStatus.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [GrpcStatus.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_FAILED,
  [GrpcStatus.ABORTED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
  [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [GrpcStatus.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR,
};

const HttpStatusToRpcStatusMap = {
  [HttpStatus.BAD_REQUEST]: GrpcStatus.INVALID_ARGUMENT,
  [HttpStatus.UNAUTHORIZED]: GrpcStatus.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: GrpcStatus.PERMISSION_DENIED,
  [HttpStatus.NOT_FOUND]: GrpcStatus.NOT_FOUND,
  [HttpStatus.TOO_MANY_REQUESTS]: GrpcStatus.RESOURCE_EXHAUSTED,
  [HttpStatus.BAD_GATEWAY]: GrpcStatus.UNKNOWN,
  [HttpStatus.SERVICE_UNAVAILABLE]: GrpcStatus.UNAVAILABLE,
  [HttpStatus.OK]: GrpcStatus.OK,
  [HttpStatus.INTERNAL_SERVER_ERROR]: GrpcStatus.INTERNAL,
  [HttpStatus.NOT_IMPLEMENTED]: GrpcStatus.UNIMPLEMENTED,
};

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
    const contextType: any = host.getType();

    const {
      status = HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code,
    } = this.getStatusAndMessage(exception, contextType);

    if (contextType === 'http') {
      return this.handleRestContext(request, response, status, message, code);
    }

    if (contextType === 'rpc') {
      return this.handleRpcContext(code, message, status);
    }

    if (contextType === 'graphql') {
      return this.graphqlFormatError(status, message, code);
    }
  }

  private getStatusAndMessage(
    exception,
    contextType: any,
  ): { status: number; message: string; code: string } {
    const errorLayer = this.identifyErrorLayer(exception);

    if (errorLayer === ErrorLayerEnum.DATABASE) {
      return {
        code: this.defaultDatabaseErrorPrefix,
        message: this.extractMessageFromException(exception, contextType),
        status: this.extractStatusCodeFromException(
          exception,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      };
    }

    if (errorLayer === ErrorLayerEnum.VALIDATION) {
      let message: string;

      if (exception?.response?.message) {
        if (isArray(exception?.response?.message)) {
          message = exception?.response?.message[0];
        } else {
          message = exception?.response?.message;
        }
      } else {
        message =
          this.extractMessageFromException(exception, contextType) || '';
      }

      return {
        code: this.defaultValidationErrorPrefix,
        message: message,
        status: this.extractStatusCodeFromException(
          exception,
          HttpStatus.BAD_REQUEST,
        ),
      };
    }

    if (errorLayer === ErrorLayerEnum.EXCEPTION) {
      const { code, message, statusCode } = exception.exception;

      return {
        code: code.toString(),
        message: this.extractMessageFromException(
          exception.exception,
          contextType,
        ),
        status: this.extractStatusCodeFromException(exception, statusCode),
      };
    }

    if (errorLayer === ErrorLayerEnum.APPLICATION) {
      if (exception instanceof HttpException) {
        return {
          code: this.defaultApplicationErrorPrefix,
          message: this.extractMessageFromException(exception, contextType),
          status: this.extractStatusCodeFromException(
            exception,
            exception.getStatus(),
          ),
        };
      }

      return {
        code: this.defaultApplicationErrorPrefix,
        message: this.extractMessageFromException(exception, contextType),
        status: this.extractStatusCodeFromException(
          exception,
          exception.status || HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      };
    }
  }

  private extractMessageFromException(exception, contextType: any): string {
    if (contextType !== 'rpc') {
      if (this.isRpcException(exception)) {
        return exception.details;
      }

      return exception.message;
    }

    return exception.message || 'There was an error';
  }

  private extractStatusCodeFromException(exception, defaultStatusCode): number {
    if (this.isRpcException(exception)) {
      return (
        RpcStatusToHttpStatusMap[exception.code] ||
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    return defaultStatusCode;
  }

  private isRpcException(exception) {
    if (exception.details && exception.code && exception.metadata) {
      return true;
    }

    return false;
  }

  private handleRestContext(
    request: any,
    response: any,
    status: number,
    message: string,
    code: string,
  ) {
    return this.setResponseCode(response, status).send({
      message,
      code,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleRpcContext(
    code: string,
    message: string = '',
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ): any {
    return throwError({
      message: `${message} [${code}]`,
      code: this.getMappedRpcStatusFromHttpStatusCode(status),
    });
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

  private identifyErrorLayer(exception): ErrorLayerEnum {
    if (
      exception instanceof QueryFailedError ||
      exception.constructor.name === 'QueryFailedError'
    ) {
      return ErrorLayerEnum.DATABASE;
    }

    if (
      exception instanceof BadRequestException ||
      exception.constructor.name === 'BadRequestException'
    ) {
      return ErrorLayerEnum.VALIDATION;
    }

    if (
      exception instanceof MappedExceptionError ||
      exception.constructor.name === 'MappedExceptionError'
    ) {
      return ErrorLayerEnum.EXCEPTION;
    }

    return ErrorLayerEnum.APPLICATION;
  }

  private getMappedRpcStatusFromHttpStatusCode(
    httpStatus: HttpStatus,
  ): GrpcStatus {
    return HttpStatusToRpcStatusMap[httpStatus] || GrpcStatus.UNKNOWN;
  }

  private setResponseCode(response: any, code: number) {
    if (response.code) {
      return response.code(code);
    } else if (response.status) {
      return response.status(code);
    }

    return response;
  }
}
