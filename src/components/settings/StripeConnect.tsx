import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useOperatorProfile,
  useConnectStripe,
  useVerifyStripeConnect,
  useDisconnectStripe,
} from '@/hooks/useStripeConnect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Unlink,
  Zap,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

function maskAccountId(accountId: string): string {
  if (accountId.length <= 8) return accountId;
  const last4 = accountId.slice(-4);
  return `acct_****${last4}`;
}

// --- Not Connected State ---

function NotConnectedState() {
  const connectStripe = useConnectStripe();

  const handleConnect = async () => {
    try {
      const result = await connectStripe.mutateAsync();
      window.location.href = result.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate Stripe connection');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle>Connect Stripe</CardTitle>
            <CardDescription>Enable billing and payment processing for your clients.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>Accept payments from clients</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Auto-create invoices</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Manage subscriptions</span>
          </div>
        </div>

        <Separator />

        <Button onClick={handleConnect} disabled={connectStripe.isPending}>
          {connectStripe.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          Connect Stripe Account
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Onboarding Incomplete State ---

function OnboardingIncompleteState() {
  const connectStripe = useConnectStripe();
  const verifyStripeConnect = useVerifyStripeConnect();

  const handleCompleteSetup = async () => {
    try {
      const result = await connectStripe.mutateAsync();
      window.location.href = result.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resume Stripe onboarding');
    }
  };

  const handleVerify = async () => {
    try {
      const result = await verifyStripeConnect.mutateAsync();
      if (result.onboarding_complete) {
        toast.success('Stripe onboarding verified successfully');
      } else {
        toast.info('Onboarding is still incomplete. Please complete the setup on Stripe.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify Stripe status');
    }
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-900">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <CardTitle>Stripe Onboarding Incomplete</CardTitle>
            <CardDescription>
              Your Stripe account setup is not finished. Complete the onboarding to start accepting payments.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Button onClick={handleCompleteSetup} disabled={connectStripe.isPending}>
          {connectStripe.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          Complete Setup
        </Button>
        <Button variant="outline" onClick={handleVerify} disabled={verifyStripeConnect.isPending}>
          {verifyStripeConnect.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Verify Status
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Connected State ---

function ConnectedState({ stripeAccountId }: { stripeAccountId: string }) {
  const disconnectStripe = useDisconnectStripe();

  const handleDisconnect = async () => {
    try {
      await disconnectStripe.mutateAsync();
      toast.success('Stripe account disconnected');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect Stripe');
    }
  };

  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Stripe Connected</CardTitle>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100">
                Active
              </Badge>
            </div>
            <CardDescription>
              Your Stripe account is connected and ready to process payments.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Account ID</p>
          <p className="text-sm font-mono">{maskAccountId(stripeAccountId)}</p>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Stripe account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This will stop all billing operations for your clients. Any active
                subscriptions and pending invoices will no longer be managed through Luma.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {disconnectStripe.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// --- Main StripeConnect Component ---

export function StripeConnect() {
  const { data: operator, isLoading } = useOperatorProfile();
  const verifyStripeConnect = useVerifyStripeConnect();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasVerified, setHasVerified] = useState(false);

  // Auto-verify on return from Stripe onboarding
  useEffect(() => {
    if (hasVerified) return;
    const stripeParam = searchParams.get('stripe');
    if (stripeParam === 'success') {
      setHasVerified(true);
      verifyStripeConnect
        .mutateAsync()
        .then((result) => {
          if (result.onboarding_complete) {
            toast.success('Stripe account connected successfully');
          } else {
            toast.info('Stripe connected, but onboarding is not yet complete.');
          }
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Failed to verify Stripe connection');
        })
        .finally(() => {
          // Clean up URL params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('stripe');
          setSearchParams(newParams, { replace: true });
        });
    }
  }, [searchParams, hasVerified, verifyStripeConnect, setSearchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!operator) {
    return null;
  }

  // Connected and onboarding complete
  if (operator.stripe_account_id && operator.stripe_onboarding_complete) {
    return <ConnectedState stripeAccountId={operator.stripe_account_id} />;
  }

  // Has account but onboarding not complete
  if (operator.stripe_account_id && !operator.stripe_onboarding_complete) {
    return <OnboardingIncompleteState />;
  }

  // Not connected
  return <NotConnectedState />;
}
