
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down";
  className?: string;
}

const MetricCard = ({ label, value, trend, className }: MetricCardProps) => {
  // Helper function to determine if the value should show a dollar sign
  const shouldShowDollar = (label: string): boolean => {
    const dollarLabels = [
      'Average Win', 'Average Loss', 'Total Results', 
      'Total Balance', 'Float', 'Last Trade Take'
    ];
    return dollarLabels.includes(label);
  };

  // Helper function to format the value based on the label
  const formatValue = (value: string | number, label: string): string => {
    if (typeof value === 'number') {
      if (shouldShowDollar(label)) {
        return `$${Math.abs(value).toFixed(2)}`;
      }
      // Add percentage sign for percentage values
      if (label.toLowerCase().includes('rate') || 
          label.toLowerCase().includes('drawdown') || 
          label.includes('5 days ago')) {
        return `${value.toFixed(2)}%`;
      }
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className={cn(
      "w-full bg-darkBlue/40",
      "shadow-[inset_0px_2px_4px_rgba(0,0,0,0.2)]",
      "hover:shadow-[inset_0px_3px_6px_rgba(0,0,0,0.25)]",
      "transition-shadow duration-200",
      "rounded-xl",
      "bg-gradient-to-b from-white/10 to-transparent",
      "backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center justify-center p-2 sm:py-2">
        <div className="text-xs sm:text-sm text-softWhite/70 font-medium">{label}</div>
        <div className="text-base sm:text-lg font-bold text-softWhite truncate max-w-full px-1">
          {formatValue(value, label)}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
