import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to parse backend UTC strings (naive) as proper Date objects
export function parseUtcDate(dateStr: string | Date): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // If string doesn't have timezone info, treat it as UTC
  // Backend sends naive ISO (e.g. "2023-10-27T10:00:00") which implies UTC in this app context
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('GMT')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

export function formatDateTime(dateStr: string | Date) {
  const dateObj = parseUtcDate(dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(dateObj);
}

export function formatDate(dateStr: string | Date) {
  const dateObj = parseUtcDate(dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(dateObj);
}
