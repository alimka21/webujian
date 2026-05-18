# REQ-008 — Dashboard & Statistik
 
**Label:** `REQ-008`  
**Area:** Stat cards, grafik, aktivitas terbaru  
**Status:** ⚠️ ~70% (error state silent perlu fix)
 
---
 
## Admin Dashboard
 
**Stat cards:** total siswa, guru, alumni, ujian aktif, berita published  
**Quick links:** ke semua halaman manajemen  
**Sumber data:** `GET /api/admin/stats`
 
## Guru Dashboard
 
**Stat cards:** total ujian, total siswa (kelas saya), rata-rata nilai, ujian aktif  
**Ujian mendatang:** 3 ujian terdekat  
**Aktivitas terbaru:** sesi ujian terbaru  
**Sumber data:** `GET /api/guru/stats`
 
## Siswa Dashboard
 
**Ujian aktif:** ujian yang bisa dikerjakan sekarang  
**Aktivitas terakhir:** ujian yang sudah selesai (klik → halaman hasil)  
**Rata-rata nilai:** dari semua sesi selesai  
**Sumber data:** `GET /api/siswa/dashboard`
 
## Aturan Error State
 
Setiap fetch di dashboard WAJIB punya:
- Error state dengan pesan jelas
- Tombol "Muat Ulang"
- Toast.error saat gagal
## File Terkait
 
- `src/pages/dashboard/AdminDashboard.tsx`
- `src/pages/dashboard/guru/GuruDashboard.tsx`
- `src/pages/dashboard/siswa/SiswaDashboard.tsx`
---
---