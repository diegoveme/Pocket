import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { StellarModule } from '../stellar/stellar.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DisputesController, ManagerDisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { EscrowService } from './escrow.service';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

@Module({
  imports: [JobsModule, StellarModule],
  controllers: [
    ContractsController,
    MilestonesController,
    DisputesController,
    ManagerDisputesController,
  ],
  providers: [ContractsService, EscrowService, MilestonesService, DisputesService],
})
export class ContractsModule {}
