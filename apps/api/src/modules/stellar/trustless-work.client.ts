import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Roles of a multi-release escrow. Every role is a Stellar address. */
export interface EscrowRoles {
  approver: string;
  serviceProvider: string;
  platformAddress: string;
  releaseSigner: string;
  disputeResolver: string;
}

export interface EscrowMilestoneInput {
  description: string;
  /** USDC. */
  amount: number;
  receiver: string;
}

export interface DeployEscrowInput {
  signer: string;
  engagementId: string;
  title: string;
  description: string;
  roles: EscrowRoles;
  /** Pocket's commission. 0 during the MVP. */
  platformFee: number;
  milestones: EscrowMilestoneInput[];
  trustline: { address: string; symbol: string };
}

/** One share of a resolved dispute. Trustless Work rejects amounts <= 0. */
export interface Distribution {
  address: string;
  amount: number;
}

export interface EscrowMilestoneState {
  description: string;
  amount: number;
  status: string;
  receiver?: string;
  flags?: {
    approved?: boolean;
    released?: boolean;
    disputed?: boolean;
    resolved?: boolean;
  };
}

/** An escrow as Trustless Work reports it. */
export interface EscrowState {
  contractId: string;
  balance: number;
  milestones: EscrowMilestoneState[];
  roles: Partial<EscrowRoles>;
}

/**
 * Thin client for the Trustless Work REST API. Every write endpoint returns an
 * unsigned transaction; whoever holds the role signs it and it is broadcast
 * through `send`.
 *
 * Endpoints and bodies follow https://dev.api.trustlesswork.com/docs-json.
 * Milestone indexes go as strings and amounts as numbers, as the API expects.
 */
@Injectable()
export class TrustlessWorkClient {
  private readonly logger = new Logger(TrustlessWorkClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('trustlessWork.apiUrl');
    this.apiKey = config.getOrThrow<string>('trustlessWork.apiKey');
  }

  deployMultiRelease(input: DeployEscrowInput): Promise<string> {
    return this.unsigned('/deployer/multi-release', input);
  }

  fund(contractId: string, signer: string, amount: number): Promise<string> {
    return this.unsigned('/escrow/multi-release/fund-escrow', {
      contractId,
      signer,
      amount,
    });
  }

  approve(contractId: string, milestoneIndex: number, approver: string): Promise<string> {
    return this.unsigned('/escrow/multi-release/approve-milestone', {
      contractId,
      milestoneIndex: String(milestoneIndex),
      approver,
    });
  }

  release(
    contractId: string,
    milestoneIndex: number,
    releaseSigner: string,
  ): Promise<string> {
    return this.unsigned('/escrow/multi-release/release-milestone-funds', {
      contractId,
      milestoneIndex: String(milestoneIndex),
      releaseSigner,
    });
  }

  dispute(contractId: string, milestoneIndex: number, signer: string): Promise<string> {
    return this.unsigned('/escrow/multi-release/dispute-milestone', {
      contractId,
      milestoneIndex: String(milestoneIndex),
      signer,
    });
  }

  resolve(
    contractId: string,
    milestoneIndex: number,
    disputeResolver: string,
    distributions: Distribution[],
  ): Promise<string> {
    return this.unsigned('/escrow/multi-release/resolve-milestone-dispute', {
      contractId,
      milestoneIndex: String(milestoneIndex),
      disputeResolver,
      distributions,
    });
  }

  /** Broadcast a signed transaction. Returns the deployed contract id, if any. */
  async send(signedXdr: string): Promise<{ contractId?: string }> {
    const result = await this.request<{
      status?: string;
      message?: string;
      contractId?: string;
    }>('POST', '/helper/send-transaction', { signedXdr });
    if (result.status && result.status !== 'SUCCESS') {
      throw new ServiceUnavailableException(
        `Trustless Work could not send the transaction: ${result.message ?? result.status}`,
      );
    }
    return { contractId: result.contractId };
  }

  /** Current state of an escrow, read from the chain rather than the indexer. */
  async getEscrow(contractId: string): Promise<EscrowState | null> {
    // The API only reads contractIds as an array when the key has brackets.
    const query = `contractIds[]=${encodeURIComponent(contractId)}&validateOnChain=true`;
    const result = await this.request<EscrowState[]>(
      'GET',
      `/helper/get-escrow-by-contract-ids?${query}`,
    );
    return result.find((escrow) => escrow.contractId === contractId) ?? null;
  }

  private async unsigned(path: string, body: unknown): Promise<string> {
    const { unsignedTransaction } = await this.request<{ unsignedTransaction?: string }>(
      'POST',
      path,
      body,
    );
    if (!unsignedTransaction) {
      throw new ServiceUnavailableException(
        `Trustless Work returned no transaction for ${path}`,
      );
    }
    return unsignedTransaction;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-api-key': this.apiKey },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.error(
        `${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`,
      );
      const message =
        typeof payload.message === 'string' ? payload.message : response.statusText;
      throw new ServiceUnavailableException(`Trustless Work error: ${message}`);
    }
    return payload as T;
  }
}
