# REQ-005 — Tracer Alumni
 
**Label:** `REQ-005`  
**Area:** CRUD alumni, statistik, export  
**Status:** ⚠️ ~75% (paginasi belum ada)
 
---
 
## Data Alumni
 
| Field | Tipe | Wajib |
|-------|------|-------|
| nama | string | ✅ |
| nis | string | - |
| tahunLulus | int | ✅ |
| jurusan | string | - |
| status | enum | ✅ |
| instansi | string | - |
| posisi | string | - |
| kontak | string | - |
| fotoUrl | string | - |
 
**Status:** `BEKERJA` | `KULIAH` | `WIRAUSAHA` | `TIDAK_DIKETAHUI`
 
## Tampilan
 
- Stat cards: total, kerja, kuliah, wirausaha
- Chart pie: distribusi status (recharts)
- Chart bar: jumlah per tahun lulus (recharts)
- Tabel dengan filter tahun + status + search nama
- Paginasi 20 per halaman (belum diimplementasi)
- Export Excel semua data
## Akses
 
Hanya `SUPER_ADMIN`
 
## File Terkait
 
- `src/pages/dashboard/AlumniTracer.tsx`
- `server/routes/admin.ts` → CRUD alumni
- `server/routes/public.ts` → GET /api/alumni/stats (public untuk landing)
---
---