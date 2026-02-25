import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  variant?: "primary" | "warm" | "success";
  className?: string;
}

export const GlowCard = ({ children, variant = "primary", className }: GlowCardProps) => {
  const glowStyles = {
    primary: "shadow-[0_0_0_1px_hsl(var(--primary)/0.1),0_4px_24px_-4px_hsl(var(--primary)/0.15)]",
    warm: "shadow-[0_0_0_1px_hsl(var(--accent-warm)/0.1),0_4px_24px_-4px_hsl(var(--accent-warm)/0.15)]",
    success: "shadow-[0_0_0_1px_hsl(var(--success)/0.1),0_4px_24px_-4px_hsl(var(--success)/0.15)]",
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 transition-all duration-200",
      glowStyles[variant],
      className
    )}>
      {children}
    </div>
  );
};
