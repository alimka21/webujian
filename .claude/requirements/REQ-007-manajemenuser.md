# REQ-007 — Manajemen User
 
**Label:** `REQ-007`  
**Area:** CRUD siswa, guru, kelas, reset password  
**Status:** ✅ ~85% (paginasi belum ada)
 
---
 
## Yang Bisa Dikelola
 
### Kelas
- nama (XII IPA 1), tingkat (X/XI/XII), tahun ajaran, wali kelas (guru)
### Guru
- NIP, nama, email, mata pelajaran, password default saat dibuat
### Siswa
- NIS (unique), nama, kelasId
- Email auto-generate: `{NIS}@siswa.sch.id`
- Password default = NIS
## Aksi per Entity
 
| Aksi | Keterangan |
|------|-----------|
| Tambah | Modal form + validasi + POST |
| Edit | Modal form ter-isi + validasi + PATCH |
| Hapus | Konfirmasi modal + DELETE |
| Reset Password | Konfirmasi + reset ke default (NIS/email awal) |
 
## File Terkait
 
- `src/pages/dashboard/ManageUsers.tsx`
- `src/pages/dashboard/Students.tsx`
- `server/routes/admin.ts` → CRUD user & kelas
- `server/routes/guru.ts` → GET kelas milik guru
---
---