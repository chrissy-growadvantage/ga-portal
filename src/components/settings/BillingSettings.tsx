import { useState } from 'react';
import { useOperatorProfile } from '@/hooks/useStripeConnect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { value: 'usd', label: 'USD — US Dollar' },
  { value: 'eur', label: 'EUR — Euro' },
  { value: 'gbp', label: 'GBP — British Pound' },
  { value: 'cad', label: 'CAD — Canadian Dollar' },
  { value: 'aud', label: 'AUD — Australian Dollar' },
] as const;

export function BillingSettings() {
  const { data: operator } = useOperatorProfile();

  const [currency, setCurrency] = useState('usd');
  const [companyName, setCompanyName] = useState(operator?.business_name ?? '');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [taxLabel, setTaxLabel] = useState('');

  const handleSave = () => {
    toast.success('Billing settings saved');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>Billing Preferences</CardTitle>
            <CardDescription>
              Configure currency, invoice branding, and tax settings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Default Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency" className="w-full sm:w-64">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Invoice Branding */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Invoice Branding</h3>
            <p className="text-sm text-muted-foreground">
              Customize how your invoices appear to clients.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceFooter">Invoice Footer Text</Label>
            <Input
              id="invoiceFooter"
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              placeholder="e.g. Payment is due within 30 days"
            />
          </div>
        </div>

        <Separator />

        {/* Tax Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Tax Settings</h3>
            <p className="text-sm text-muted-foreground">
              Set a default tax rate and label for invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxLabel">Tax Label</Label>
              <Input
                id="taxLabel"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                placeholder='e.g. Sales Tax, VAT, GST'
              />
            </div>
          </div>
        </div>

        <Separator />

        <Button onClick={handleSave}>Save Billing Settings</Button>
      </CardContent>
    </Card>
  );
}
