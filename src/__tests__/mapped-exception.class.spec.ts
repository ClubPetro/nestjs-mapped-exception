import { MappedException } from '../core/mapped-exception.class';

class MockExceptionClass {}

describe('MappedException', () => {
  const mappedException = new MappedException(MockExceptionClass, {
    prefix: 'ERR',
  });
  it('should be defined', () => {
    expect(mappedException).toBeDefined();
  });
});
