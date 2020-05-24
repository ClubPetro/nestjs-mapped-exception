# nestjs-mapped-exception

It helps handle with exception on your nestjs application.
Using this package, we can define code for our exception separating by features, where each exception will have a code (four digits), and prefix code and suffix code (see how to setup it bellow).
For example, if we have a feature called `user`, a exception with code 1 and a prefix set up as `ERR`, we will get the code `ERR0001USE`

## Requirements

- NodeJS 10.13.0 or later
- NestJS 7 or later

## Usage

### Instalation

```
$ npm install -- save nestjs-mapped-exception
```

or yarn

```
$ yarn add nestjs-mapped-exception
```

### Setup

To setup the exception to the feature module, we have import the `MappedExceptionModule` in our module like this:

```ts
// user.module.ts

import { UserException } from './user.exception';
import { MappedExceptionModule } from 'nestjs-mapped-exception';

@Module({
  imports: [
    MappedExceptionModule.forFeature(UserException, {
      prefix: 'USER_ERROR_',
    }),
  ],
  ...
})
export class UserModule {}
```

_You also can use environment variable to set prefix with **MAPPED_EXCEPTION_PREFIX=** on your `.env` file_

After, we need to create our exception file

```ts
// user.exception.ts

import { MappedExceptionItem } from 'nestjs-mapped-exception';
import { HttpStatus } from '@nestjs/common';

export class UserException {
  MY_CUSTOM_ERROR: MappedExceptionItem = {
    message: 'This is my custom error',
    code: 1,
    statusCode: HttpStatus.BAD_REQUEST,
  };
}
```

The status code is used for `REST` context, for `GraphQL` or `Microservice` contex, maybe we cannot use that.

Then we need to inject our exception in the service layer like this:

```ts
// user.service.ts

import { MappedException } from 'nestjs-mapped-exception';
@Injectable()
export class UserService {
  constructor(private readonly exception: MappedException<UserException>) {}

  myMethodException() {
    this.exception.ERRORS.MY_CUSTOM_ERROR.throw();
  }
}
```

And for the last step, we have to threat the exception inside the service using the NestJs Filters:

```ts
// user.controller.ts

import { MappedExceptionFilter } from 'nestjs-mapped-exception';
@UseFilters(MappedExceptionFilter)
export class UserController {
  // ...
}
```

This can be used on resolvers in GraphQl context

This way, our `MappedExceptionFilter` will handle with all error generated on the service layer
