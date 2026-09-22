import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController, ApplicationsController],
  providers: [JobsService, ApplicationsService],
  exports: [JobsService, ApplicationsService],
})
export class JobsModule {}
