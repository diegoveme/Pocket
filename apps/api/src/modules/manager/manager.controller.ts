import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth';
import { ListVerificationsDto } from './dto/list-verifications.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { ManagerService } from './manager.service';

@ApiTags('manager')
@ApiBearerAuth()
@Roles('manager')
@Controller('manager/verifications')
export class ManagerController {
  constructor(private readonly manager: ManagerService) {}

  /** Verification queue. Defaults to the requests still waiting. */
  @Get()
  list(@Query() query: ListVerificationsDto) {
    return this.manager.list(query.status);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() manager: AuthUser,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.manager.approve(id, manager.sub, dto.note);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() manager: AuthUser,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.manager.reject(id, manager.sub, dto.note);
  }
}
