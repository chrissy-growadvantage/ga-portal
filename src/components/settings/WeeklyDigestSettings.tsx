import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
] as const;

const TIMES = [
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
] as const;

export function WeeklyDigestSettings() {
  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState('monday');
  const [time, setTime] = useState('09:00');
  const [sending, setSending] = useState(false);

  async function handleSendTest() {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('weekly-digest', {
        body: { test: true },
      });

      if (error) {
        toast.error('Failed to send test digest', { description: error.message });
      } else {
        toast.success('Test digest sent', {
          description: 'Check inboxes for clients with active portal links.',
        });
      }
    } catch {
      toast.error('Failed to send test digest');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Weekly Digest
        </CardTitle>
        <CardDescription>
          Send clients a weekly email summarising deliveries, pending approvals, and scope usage
          with a link to their portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="digest-toggle" className="font-medium">
            Enable weekly digest emails
          </Label>
          <Switch
            id="digest-toggle"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="digest-day">Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger id="digest-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="digest-time">Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="digest-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleSendTest}
              disabled={sending}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
