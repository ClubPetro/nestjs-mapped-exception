import { MappedExceptionItem } from '../types/mapped-exceptions-item.class';
import { MappedExceptionOptions } from './mapped-exception.module';
import { MappedExceptionError } from './mapped-exception-error.class';

export class MappedException<T> {
  ERRORS: T;

  private options: MappedExceptionOptions;

  constructor(exception: any, options: MappedExceptionOptions) {
    this.options = options;

    let instance = new exception();

    if (!this.options.suffix) {
      this.options.suffix = this.suffixFromExceptionInstance(instance);
    }

    instance = this.setupExceptions(instance);
    this.ERRORS = instance;
  }

  private setupExceptions(exceptionClass: T): T {
    Object.getOwnPropertyNames(exceptionClass).map((item, index) => {
      const mappedExceptionItem = this.isValidMappedExceptionItemOrFail(
        exceptionClass[item],
      );

      mappedExceptionItem.code = this.getExceptionItemCode(
        mappedExceptionItem,
        index,
      );

      if (!mappedExceptionItem.throw) {
        mappedExceptionItem.throw = this.getThrowFunction(mappedExceptionItem);
      }

      exceptionClass[item] = mappedExceptionItem;
    });

    return exceptionClass;
  }

  private isValidMappedExceptionItemOrFail(item: any): MappedExceptionItem {
    if (item.message && item.statusCode) {
      return new MappedExceptionItem(item);
    }

    throw new Error('Invalid Exception item');
  }

  private getThrowFunction(exceptionItem: MappedExceptionItem) {
    return () => {
      throw new MappedExceptionError(exceptionItem);
    };
  }

  private getExceptionItemCode(
    exceptionItem: MappedExceptionItem,
    index: number,
  ): string {
    if (exceptionItem.code) {
      if (typeof exceptionItem.code === 'string') {
        if (isNaN(Number(exceptionItem.code))) {
          return exceptionItem.code;
        }
      }

      return this.generateExceptionItemCode(+exceptionItem.code);
    }

    return this.generateExceptionItemCode(index);
  }

  private generateExceptionItemCode(code: number): string {
    return `${this.options.prefix}${code.toString().padStart(4, '0')}${
      this.options.suffix
    }`;
  }

  private suffixFromExceptionInstance(exceptionClass: any): string {
    return exceptionClass.constructor.name
      .toString()
      .substring(0, 3)
      .toUpperCase()
      .padStart(3, '_');
  }
}
