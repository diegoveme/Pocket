import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Verified } from '../../common/decorators/verified.decorator';
import type { AuthUser } from '../../common/types/auth';
import { DisputesService } from './disputes.service';
import { OpenDisputeDto } from './dto/dispute.dto';
import { DeliverDto, RequestChangesDto } from './dto/milestone-actions.dto';
import { SignedTransactionDto } from '../stellar/dto/signed-transaction.dto';
import { MilestonesService } from './milestones.service';

@ApiTags('milestones')
@ApiBearerAuth()
@Verified()
@Controller('milestones')
export class MilestonesController {
  constructor(
    private readonly milestones: MilestonesService,
    private readonly disputes: DisputesService,
  ) {}

  @Roles('specialist')
  @Post(':id/deliveries')
  deliver(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeliverDto,
  ) {
    return this.milestones.deliver(user, id, dto);
  }

  @Roles('startup')
  @Post(':id/request-changes')
  requestChanges(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.milestones.requestChanges(user, id, dto);
  }

  /** Approval transaction for the startup's wallet to sign. */
  @Roles('startup')
  @Post(':id/approve/prepare')
  prepareApprove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.milestones.prepareApprove(user, id);
  }

  /** Broadcast the signed approval; Pocket then pays the specialist. */
  @Roles('startup')
  @Post(':id/approve/submit')
  submitApprove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignedTransactionDto,
  ) {
    return this.milestones.submitApprove(user, id, dto.signedXdr);
  }

  /** Retry the payment of an approved milestone. */
  @Roles('startup', 'manager')
  @Post(':id/release')
  release(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.milestones.retryRelease(user, id);
  }

  /** Dispute transaction for the party opening it to sign. */
  @Roles('startup', 'specialist')
  @Post(':id/dispute/prepare')
  prepareDispute(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.disputes.prepareOpen(user, id);
  }

  @Roles('startup', 'specialist')
  @Post(':id/dispute')
  openDispute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.disputes.open(user, id, dto);
  }
}
