import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { currentLocale, tr } from "@/i18n/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(currentLocale(), { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(currentLocale(), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat(currentLocale(), { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return tr("time.now");
  if (mins < 60) return tr("time.m", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tr("time.h", { n: hours });
  const days = Math.floor(hours / 24);
  return tr("time.d", { n: days });
}
