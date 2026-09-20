# REQ-004 — Presensi Siswa
 
**Label:** `REQ-004`  
**Area:** Input presensi, rekap bulanan, export  
**Status:** ⚠️ ~70%
 
---
 
## Status Kehadiran
 
`HADIR` | `IZIN` | `SAKIT` | `ALPHA` | `BOLOS`
 
## Flow Guru & Admin
 
1. Pilih kelas + tanggal
2. Tabel siswa dengan radio per baris (HADIR/IZIN/SAKIT/ALPHA/BOLOS)
3. Field keterangan opsional per siswa
4. Tombol "Tandai Semua Hadir" untuk shortcut
5. Submit batch → `POST /api/guru/presensi`
6. Kalau sudah ada presensi hari itu → mode edit
7. SUPER_ADMIN juga bisa akses halaman ini (`/dashboard/guru/presensi`) untuk
   melihat & mengubah presensi semua kelas; disimpan atas nama wali kelas terkait.
## Rekap Bulanan
 
- Pilih kelas + bulan + tahun
- Tabel: nama | hadir | izin | sakit | alpha | bolos | persentase
- Grafik bar (recharts)
- Export Excel → `GET /api/guru/presensi/export`
## File Terkait
 
- `src/pages/dashboard/Attendance.tsx`
- `server/routes/guru.ts` → endpoint presensi
## Endpoint
 
```
POST /api/guru/presensi                              → batch input
GET  /api/guru/presensi?kelasId=&tanggal=           → 1 hari
GET  /api/guru/presensi/rekap?kelasId=&bulan=&tahun= → bulanan
GET  /api/guru/presensi/export?...&format=xlsx       → download
```
 
---
---