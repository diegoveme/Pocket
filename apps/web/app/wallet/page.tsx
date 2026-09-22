'use client';

import { PageHeader } from '@/components/page';
import { RequireAuth } from '@/components/require-auth';
import { UsdcStatus } from '@/components/usdc-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WalletPage() {
  return (
    <RequireAuth roles={['startup', 'specialist']}>
      {(user) => (
        <div className="mx-auto max-w-2xl space-y-6">
          <PageHeader
            title="Wallet and USDC"
            description="Pocket never holds your funds or keys. Payments move between your wallet and the escrow."
          />
          <Card>
            <CardHeader>
              <CardTitle>Connected wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-sm">{user.stellarAddress}</p>
            </CardContent>
          </Card>
          <UsdcStatus user={user} showReady />
        </div>
      )}
    </RequireAuth>
  );
}
