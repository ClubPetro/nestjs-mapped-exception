import { Controller, UseFilters } from '@nestjs/common';
import { MappedExceptionFilter } from '../../..';
import { ForRootService } from './forRoot.service';

@Controller('forroot')
@UseFilters(MappedExceptionFilter)
export class ForRootController {
  constructor(private readonly service: ForRootService) {}
}
