import { DynamicModule, Module } from '@nestjs/common';
import { MappedException } from './mapped-exception.class';

export class MappedExceptionOptions {
  prefix: string;
  suffix?: string;
}

@Module({})
export class MappedExceptionModule {
  static forFeature<T>(
    exception: T | object | object[],
    options: MappedExceptionOptions = { prefix: 'ERR' },
  ): DynamicModule {
    let exceptionArr: (T | object)[];

    if (Array.isArray(exception)) {
      exceptionArr = exception;
    } else {
      exceptionArr = [exception];
    }

    const providers = exceptionArr.map((exception) => ({
      provide: MappedException,
      useValue: new MappedException<T>(exception, options),
    }));

    return {
      providers,
      exports: providers,
      module: MappedExceptionModule,
    };
  }
}
