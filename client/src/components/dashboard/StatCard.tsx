import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  trend?: string | number;
  trendDirection?: "up" | "down" | "neutral";
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  comparisonPeriod?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon,
  iconBgColor = "bg-primary bg-opacity-10",
  iconColor = "text-primary",
  comparisonPeriod = "from last month",
  className,
}: StatCardProps) {
  const trendColor = 
    trendDirection === "up" 
      ? "text-success" 
      : trendDirection === "down" 
        ? "text-destructive" 
        : "text-neutral-500 dark:text-neutral-400";

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-5 border border-neutral-200 dark:border-neutral-700", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-1 text-neutral-800 dark:text-neutral-100">{value}</h3>
          {trend !== undefined && (
            <p className={cn("flex items-center text-sm mt-1", trendColor)}>
              <i className={`${trendDirection === "up" ? "ri-arrow-up-line" : "ri-arrow-down-line"} mr-1`}></i>
              <span>{trend}</span> {comparisonPeriod}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", iconBgColor, iconColor)}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}
