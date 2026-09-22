import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth';
import { ApplicationsService } from './applications.service';

@ApiTags('applications')
@ApiBearerAuth()
@Roles('specialist')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  /** The signed-in specialist's applications, with the job each one is for. */
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.applications.mine(user);
  }

  @Post(':id/withdraw')
  withdraw(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.applications.withdraw(user, id);
  }
}
