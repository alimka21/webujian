import { useEffect, useState } from 'react';
import api from '../lib/api';

export interface SiteConfigPartial {
  namaSekolah?: string;
  jenjang?: 'SD' | 'SMP' | 'SMA' | 'SMK' | null;
  logoUrl?: string;
  faviconUrl?: string;
}

/**
 * Cache module-level supaya tidak fetch berulang dari banyak komponen.
 * Dipakai kalau bentuk full SiteConfig tidak relevan — hanya butuh
 * nilai-nilai untuk UX (jenjang, nama, dll).
 */
let cached: SiteConfigPartial | null = null;
let inflight: Promise<SiteConfigPartial> | null = null;

async function fetchConfig(): Promise<SiteConfigPartial> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = api.get('/api/site-config').then(
    (cfg) => { cached = cfg; return cfg; },
    () => { cached = {}; return cached!; },
  );
  return inflight;
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfigPartial | null>(cached);

  useEffect(() => {
    let mounted = true;
    fetchConfig().then((cfg) => {
      if (mounted) setConfig(cfg);
    });
    return () => { mounted = false; };
  }, []);

  return config ?? {};
}

/**
 * List tingkat yang valid berdasarkan jenjang.
 * - SD: 1-6
 * - SMP: 7-9
 * - SMA / SMK: 10-12
 * - undefined / lain: 1-12 (semua)
 */
export function tingkatOptions(jenjang?: string | null): number[] {
  if (jenjang === 'SD') return [1, 2, 3, 4, 5, 6];
  if (jenjang === 'SMP') return [7, 8, 9];
  if (jenjang === 'SMA' || jenjang === 'SMK') return [10, 11, 12];
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

/** Jumlah opsi default pada soal pilihan ganda berdasarkan jenjang */
export function defaultPgOpsiCount(jenjang?: string | null): 4 | 5 {
  return jenjang === 'SMA' || jenjang === 'SMK' ? 5 : 4;
}
