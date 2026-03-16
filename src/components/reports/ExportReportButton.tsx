import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { MonthlyReportPDF } from './MonthlyReportPDF';
import { useMonthlyReportData } from '@/hooks/useMonthlyReportData';
import { toast } from 'sonner';

type ExportReportButtonProps = {
  clientId: string;
  monthSlug: string;
};

export function ExportReportButton({ clientId, monthSlug }: ExportReportButtonProps) {
  const [generating, setGenerating] = useState(false);
  const { data } = useMonthlyReportData(clientId, monthSlug);

  const handleExport = async () => {
    if (!data) {
      toast.error('Report data not ready');
      return;
    }

    setGenerating(true);
    try {
      const clientName = data.client.company_name || data.client.contact_name || 'Client';
      const blob = await pdf(
        <MonthlyReportPDF
          clientName={clientName}
          monthLabel={data.snapshot.month_label}
          snapshot={data.snapshot}
          deliveries={data.deliveries}
          scopeCalc={data.scopeCalc}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientName.replace(/\s+/g, '-')}-${monthSlug}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleExport}
      disabled={generating || !data}
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Export PDF
    </Button>
  );
}
