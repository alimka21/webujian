# REQ-003 — Anti-Cheat & Timer
 
**Label:** `REQ-003`  
**Area:** Fullscreen, deteksi tab switch, alarm, timer countdown  
**Status:** ✅ Selesai
 
---
 
## Deteksi Pelanggaran
 
| Event | Tipe Pelanggaran | Kode |
|-------|-----------------|------|
| `document.hidden` = true | Pindah tab | `TAB_SWITCH` |
| Keluar fullscreen | Keluar layar penuh | `FULLSCREEN_EXIT` |
| Window blur (non-fullscreen) | Fokus hilang | `WINDOW_BLUR` |
| F12, Ctrl+Shift+I/J/C | Buka DevTools | `DEVTOOLS` |
 
## Aturan Pelanggaran
 
- Max pelanggaran default: **3x**
- Setiap pelanggaran: bunyi alarm (Web Audio API) + warning overlay
- Pelanggaran ke-3: auto-submit dengan reason `"auto_cheat"`
- Semua pelanggaran di-log ke tabel `Pelanggaran` via `POST /api/siswa/sesi/:id/violation`
## Timer
 
- Durasi dari `SesiUjian` (dalam menit × 60 = detik)
- Disimpan ke localStorage: `exam_timer_${sessionId}`
- **Warning** (kuning): sisa ≤ 10 menit
- **Critical** (merah): sisa ≤ 2 menit
- Expire → auto-submit reason `"timeout"`
## File Terkait
 
- `src/hooks/useAntiCheat.ts`
- `src/hooks/useExamTimer.ts`
- `src/pages/exam/TakeExam.tsx`
- `server/routes/siswa.ts` → endpoint violation
---
---