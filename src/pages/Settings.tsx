import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { AddonLibrary } from '@/components/settings/AddonLibrary';
import { WebhookManager } from '@/components/settings/WebhookManager';
import { StripeConnect } from '@/components/settings/StripeConnect';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { PickListsSettings } from '@/components/settings/PickListsSettings';
import { WeeklyDigestSettings } from '@/components/settings/WeeklyDigestSettings';

export default function Settings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'billing' ? 'billing' : 'account';

  useEffect(() => {
    document.title = 'Settings — Luma';
    return () => { document.title = 'Luma'; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="addon-library">Addon Library</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="pick-lists">Pick Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          <WeeklyDigestSettings />
        </TabsContent>

        <TabsContent value="addon-library">
          <AddonLibrary />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <StripeConnect />
          <BillingSettings />
        </TabsContent>

        <TabsContent value="pick-lists">
          <PickListsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
