import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { acceptProposalSchema, type AcceptProposalInput } from '@/lib/proposal-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface PortalAcceptanceFormProps {
  onAccept: (data: AcceptProposalInput) => Promise<void>;
  onDecline: (reason?: string) => Promise<void>;
  total: number;
  isSubmitting: boolean;
}

export function PortalAcceptanceForm({ onAccept, onDecline, total, isSubmitting }: PortalAcceptanceFormProps) {
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcceptProposalInput>({
    resolver: zodResolver(acceptProposalSchema),
    defaultValues: {
      signer_name: '',
      signer_email: '',
      consent: undefined,
    },
  });

  const signerName = watch('signer_name');

  const onSubmit = handleSubmit(async (data) => {
    await onAccept(data);
  });

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline(declineReason.trim() || undefined);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">Accept Proposal</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Consent checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            onCheckedChange={(checked) => {
              setValue('consent', checked === true ? true : (undefined as never), { shouldValidate: true });
            }}
            disabled={isSubmitting}
            aria-label="I agree to the services and pricing outlined in this proposal"
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              I agree to the services and pricing outlined in this proposal
              <span className="font-mono font-semibold ml-1">(${total.toFixed(2)})</span>
            </Label>
            {errors.consent && (
              <p className="text-xs text-destructive mt-1">{errors.consent.message}</p>
            )}
          </div>
        </div>

        {/* Signer name */}
        <div className="space-y-2">
          <Label htmlFor="signer_name">Type your full name</Label>
          <Input
            id="signer_name"
            placeholder="Your full name"
            {...register('signer_name')}
            disabled={isSubmitting}
            aria-label="Your full name for signature"
          />
          {errors.signer_name && (
            <p className="text-xs text-destructive">{errors.signer_name.message}</p>
          )}

          {/* Signature preview */}
          {signerName && (
            <div className="pt-2 pb-1 border-b border-border/60">
              <p
                className="text-3xl text-primary"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                {signerName}
              </p>
            </div>
          )}
        </div>

        {/* Signer email */}
        <div className="space-y-2">
          <Label htmlFor="signer_email">Email address <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="signer_email"
            type="email"
            placeholder="you@example.com"
            {...register('signer_email')}
            disabled={isSubmitting}
            aria-label="Email address"
          />
          {errors.signer_email && (
            <p className="text-xs text-destructive">{errors.signer_email.message}</p>
          )}
        </div>

        {/* Accept button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] text-base gap-2"
          aria-label="Accept proposal"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Accept Proposal'
          )}
        </Button>
      </form>

      {/* Decline section */}
      {!showDecline ? (
        <button
          type="button"
          onClick={() => setShowDecline(true)}
          disabled={isSubmitting}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 py-2 transition-colors"
          aria-label="Decline this proposal"
        >
          Not ready? Decline
        </button>
      ) : (
        <div className="mt-4 space-y-3 p-4 rounded-lg bg-muted/30 border border-border/60">
          <p className="text-sm font-medium">Decline this proposal</p>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="We'd love to hear why. (optional)"
            className="min-h-[80px] resize-none"
            disabled={isDeclining}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isDeclining}
              className="min-h-[44px] gap-2"
              aria-label="Confirm decline"
            >
              {isDeclining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm Decline'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDecline(false);
                setDeclineReason('');
              }}
              disabled={isDeclining}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
