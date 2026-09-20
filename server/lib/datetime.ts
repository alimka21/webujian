// Zona waktu resmi aplikasi: WIT (UTC+9, tidak ada DST di Indonesia).
// Dipakai supaya batas "hari ini" tidak tergantung timezone sistem server
// (mis. Hostinger bisa UTC, beda dengan WIT tempat sekolah berada).
const WIT_OFFSET_MS = 9 * 60 * 60000;

export function startOfTodayWIT(): Date {
  const nowWitMs = Date.now() + WIT_OFFSET_MS;
  const witDate = new Date(nowWitMs);
  const y = witDate.getUTCFullYear();
  const m = witDate.getUTCMonth();
  const d = witDate.getUTCDate();
  return new Date(Date.UTC(y, m, d) - WIT_OFFSET_MS);
}
