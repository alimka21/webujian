import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(number: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

// Zona waktu resmi aplikasi: WIT (UTC+9, tidak ada DST di Indonesia).
export const APP_TIMEZONE = "Asia/Jayapura";
const WIT_OFFSET_MINUTES = 9 * 60;

export function formatDate(date: Date | string | number, formatType: "short" | "long" | "time" | "datetime" = "long"): string {
  const d = new Date(date);

  if (formatType === "short") {
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: APP_TIMEZONE });
  }
  if (formatType === "time") {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE });
  }
  if (formatType === "datetime") {
    return d.toLocaleString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE
    }) + " WIT";
  }

  // long default
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: APP_TIMEZONE });
}

/**
 * Konversi value <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") — yang
 * dianggap sebagai jam dinding WIT — menjadi ISO string UTC untuk dikirim
 * ke server. Ini menghindari salah interpretasi zona waktu antara browser
 * guru dan zona waktu server saat parsing string datetime tanpa offset.
 */
export function witInputToUTCISOString(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  const asIfUTC = new Date(`${datetimeLocal}:00.000Z`).getTime();
  return new Date(asIfUTC - WIT_OFFSET_MINUTES * 60000).toISOString();
}

/**
 * Konversi Date/ISO string (instant UTC yang tersimpan di server) menjadi
 * value untuk <input type="datetime-local"> yang menampilkan jam dinding WIT.
 */
export function utcToWitInput(date: Date | string): string {
  const witMs = new Date(date).getTime() + WIT_OFFSET_MINUTES * 60000;
  return new Date(witMs).toISOString().slice(0, 16);
}
