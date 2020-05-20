import { Module, DynamicModule } from '@nestjs/common';
import { MappedException } from './mapped-exception.class';

export class MappedExceptionOptions {
  prefix: string;
  suffix?: string;
}

@Module({})
export class MappedExceptionModule {
  static forFeature<T>(
    exception: T,
    options: MappedExceptionOptions = { prefix: 'ERR' },
  ): DynamicModule {
    const providers = [
      {
        provide: MappedException,
        useValue: new MappedException<T>(exception, options),
      },
    ];

    return {
      providers,
      exports: providers,
      module: MappedExceptionModule,
    };
  }
}
