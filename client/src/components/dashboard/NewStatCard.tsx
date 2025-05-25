import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type NewStatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor: string;
  subtitle?: string;
  trend?: string | number;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
};

export default function NewStatCard({
  title,
  value,
  icon,
  iconColor,
  subtitle,
  trend,
  trendDirection = "neutral",
  className,
}: NewStatCardProps) {
  const trendColor = 
    trendDirection === "up" 
      ? "text-success" 
      : trendDirection === "down" 
        ? "text-destructive" 
        : "text-neutral-500 dark:text-neutral-400";

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-5 border border-neutral-200 dark:border-neutral-700", className)}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", iconColor)}>
          {icon}
        </div>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
      </div>
      
      <div className="flex flex-col">
        <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{value}</h3>
        {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
      </div>
      
      {trend !== undefined && (
        <div className={cn("flex items-center mt-3 text-xs font-medium", trendColor)}>
          {trendDirection === "up" ? (
            <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2.5L9.5 6L8.5 7L6.5 5L6.5 9.5L5.5 9.5L5.5 5L3.5 7L2.5 6L6 2.5Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9.5L2.5 6L3.5 5L5.5 7L5.5 2.5L6.5 2.5L6.5 7L8.5 5L9.5 6L6 9.5Z" fill="currentColor"/>
            </svg>
          )}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}