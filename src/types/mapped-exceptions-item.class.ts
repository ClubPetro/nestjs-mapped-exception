export class MappedExceptionItem {
  message!: string;
  statusCode!: number;
  code?: number | string;
  throw?(): void;

  constructor(item: Partial<MappedExceptionItem>) {
    this.message = item.message;
    this.statusCode = item.statusCode;
    this.code = item.code;
    this.throw = item.throw;
  }
}
