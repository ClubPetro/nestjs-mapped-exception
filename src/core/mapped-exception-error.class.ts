import { MappedExceptionItem } from '../types/mapped-exceptions-item.class';

export class MappedExceptionError {
  exception: MappedExceptionItem;

  constructor(exceptionItem: MappedExceptionItem) {
    this.exception = exceptionItem;
  }
}
