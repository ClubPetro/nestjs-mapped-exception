import { DynamicModule, Module } from '@nestjs/common';
import { MappedException } from './mapped-exception.class';

export class MappedExceptionOptions {
  prefix: string;
  suffix?: string;
}

@Module({})
export class MappedExceptionModule {
  static forFeature<T>(
    exception: T | object,
    options: MappedExceptionOptions = { prefix: 'ERR' },
  ): DynamicModule {
    const provider = {
      provide: MappedException,
      useValue: new MappedException<T>(exception, options),
    };

    return {
      providers: [provider],
      exports: [provider],
      module: MappedExceptionModule,
    };
  }

  static forRoot(
    exceptions: object[],
    options: MappedExceptionOptions = { prefix: 'ERR' },
  ): DynamicModule {
    const providers = exceptions.map((exception: any) => {
      const exceptionInstance = new exception();
      return {
        provide: exception,
        useValue: new MappedException<typeof exceptionInstance>(
          exception,
          options,
        ),
      };
    });

    return {
      providers: providers,
      exports: providers,
      module: MappedExceptionModule,
    };
  }
}
