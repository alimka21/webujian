# REQ-006 — CMS Berita Sekolah
 
**Label:** `REQ-006`  
**Area:** CRUD berita, slug, status, landing page  
**Status:** ⚠️ ~80% (fitur preview belum ada)
 
---
 
## Status Berita
 
`DRAFT` → `PUBLISHED` → `ARCHIVED`
 
## Data Berita
 
- judul, slug (auto-generate, editable), konten, ringkasan
- imageUrl (header image), status, publishedAt
## Fitur Admin
 
- List berita dengan filter status + search judul
- Form tambah/edit: judul, slug, ringkasan, konten, gambar, status
- Toggle publish/unpublish cepat dari tabel
- Preview di tab baru (belum diimplementasi)
- Hapus dengan konfirmasi
## Tampilan Public
 
- Landing page: 3 berita PUBLISHED terbaru
- Halaman `/berita/:slug` → detail berita + berita lain
## File Terkait
 
- `src/pages/dashboard/CmsManage.tsx`
- `src/pages/BeritaDetail.tsx`
- `src/pages/LandingPage.tsx`
- `server/routes/admin.ts` → CRUD berita (admin)
- `server/routes/public.ts` → GET berita (public)
---
---
 