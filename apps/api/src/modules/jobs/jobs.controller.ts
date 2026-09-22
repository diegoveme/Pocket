import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Verified } from '../../common/decorators/verified.decorator';
import type { AuthUser } from '../../common/types/auth';
import { ApplicationsService } from './applications.service';
import { ApplyDto } from './dto/apply.dto';
import { BrowseJobsDto } from './dto/browse-jobs.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly applications: ApplicationsService,
  ) {}

  @ApiBearerAuth()
  @Roles('startup')
  @Verified()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    return this.jobs.create(user, dto);
  }

  /** Board of open jobs, filtered by category or free text. */
  @Public()
  @Get()
  board(@Query() query: BrowseJobsDto) {
    return this.jobs.board(query);
  }

  /** Jobs the signed-in startup posted, in every state. */
  @ApiBearerAuth()
  @Roles('startup')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.jobs.mine(user);
  }

  @Public()
  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.detail(id);
  }

  @ApiBearerAuth()
  @Roles('startup')
  @Verified()
  @Post(':id/close')
  close(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.close(user, id);
  }

  @ApiBearerAuth()
  @Roles('specialist')
  @Verified()
  @Post(':id/applications')
  apply(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyDto,
  ) {
    return this.applications.apply(user, id, dto);
  }

  /** Applicants to one of the signed-in startup's jobs. */
  @ApiBearerAuth()
  @Roles('startup')
  @Get(':id/applications')
  applicants(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.applications.forJob(user, id);
  }
}
