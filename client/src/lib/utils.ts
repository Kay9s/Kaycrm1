import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

export function generateBookingReference(): string {
  // Generate a random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BK-${randomNum}`;
}

export function calculateDuration(startDate: Date, endDate: Date): number {
  // Calculate the number of days between two dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Convert to days
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function calculateTotalAmount(dailyRate: number, startDate: Date, endDate: Date): number {
  const days = calculateDuration(startDate, endDate);
  return dailyRate * days;
}
