import { MappedExceptionItem } from '../types/mapped-exceptions-item.class';
import { HttpStatus } from '@nestjs/common';
import { MappedExceptionError } from './mapped-exception-error.class';

const prepareCode = (code: number, suffix?: string) => {
  return `${
    globalThis.MAPPED_EXCEPTION_PREFIX || 'ERR'
  }${code.toString().padStart(4, '0')}${suffix}`;
};

const DATABASE = {
  DEFAULT: new MappedExceptionItem({
    message: 'There was an database error',
    code: prepareCode(1, 'DTB'),
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    throw: () => {
      throw new MappedExceptionError(DATABASE.DEFAULT);
    },
  }),
};
const VALIDATION = {
  DEFAULT: new MappedExceptionItem({
    message: 'There was an validation error',
    code: prepareCode(1, 'VAL'),
    statusCode: HttpStatus.BAD_REQUEST,
    throw: () => {
      throw new MappedExceptionError(VALIDATION.DEFAULT);
    },
  }),
};
const OPERATION = {
  DEFAULT: new MappedExceptionItem({
    message: 'There was an error',
    code: prepareCode(1, 'OPE'),
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    throw: () => {
      throw new MappedExceptionError(OPERATION.DEFAULT);
    },
  }),
};

const DEFAULT = new MappedExceptionItem({
  message: 'There was an unknown error',
  code: prepareCode(1, 'DFT'),
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  throw: () => {
    throw new MappedExceptionError(DEFAULT);
  },
});

export const DEFAULT_EXCEPTIONS = {
  DEFAULT,
  DATABASE,
  VALIDATION,
  OPERATION,
};
