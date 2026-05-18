# SRS INDEX — Web Ujian Sekolah Modern

> Baca file ini untuk menemukan requirement yang relevan.
> Baca detail requirement HANYA jika diperlukan untuk task saat ini.

---

## 📋 Cara Pakai Index Ini

1. Identifikasi fitur/area yang sedang dikerjakan
2. Cari label REQ yang relevan di tabel bawah
3. Baca HANYA file requirement tersebut
4. Jangan baca semua file sekaligus

---

## 📑 Daftar Requirement

| Label | Nama | Path | Scope |
|-------|------|------|-------|
| `REQ-001` | Autentikasi & Otorisasi | `.claude/requirements/REQ-001-auth.md` | Login, JWT, role, session, middleware |
| `REQ-002` | Sistem Ujian Online | `.claude/requirements/REQ-002-ujian.md` | Buat ujian, soal, sesi, submit, nilai |
| `REQ-003` | Anti-Cheat & Timer | `.claude/requirements/REQ-003-anticheattimer.md` | Fullscreen, tab switch, alarm, timer |
| `REQ-004` | Presensi Siswa | `.claude/requirements/REQ-004-presensisiswa.md` | Input presensi, rekap, export |
| `REQ-005` | Tracer Alumni | `.claude/requirements/REQ-005-traceralumni.md` | CRUD alumni, statistik, export |
| `REQ-006` | CMS Berita | `.claude/requirements/REQ-006-cms.md` | CRUD berita, slug, status, landing |
| `REQ-007` | Manajemen User | `.claude/requirements/REQ-007-manajemenuser.md` | CRUD siswa, guru, kelas, reset password |
| `REQ-008` | Dashboard & Statistik | `.claude/requirements/REQ-008-dashboardstatistik.md` | Stat cards, grafik, aktivitas terbaru |
| `REQ-009` | Deploy & Infrastruktur | `.claude/requirements/REQ-009-deployinfrastruktur.md` | Hostinger, MySQL, GitHub CI/CD |
| `REQ-010` | UI/UX Standards | `.claude/requirements/REQ-010-uiuxstandards.md` | Komponen, pola, aksesibilitas, toast |

---

## 🔗 Relasi Antar Requirement

```
REQ-001 (Auth)
  └── dipakai oleh semua REQ lainnya (middleware requireRole)

REQ-002 (Ujian)
  ├── REQ-003 (Anti-Cheat) — berjalan selama sesi ujian
  ├── REQ-007 (User) — siswa & guru adalah aktor utama
  └── REQ-008 (Dashboard) — hasil ujian ditampilkan di dashboard

REQ-004 (Presensi)
  └── REQ-007 (User) — input presensi per siswa per kelas

REQ-005, REQ-006 (Alumni, CMS)
  └── REQ-001 (Auth) — hanya SUPER_ADMIN yang bisa kelola

REQ-010 (UI/UX)
  └── berlaku untuk SEMUA halaman frontend
```

---

## 📍 Quick Reference: Mana Requirement yang Relevan?

| Task yang Sedang Dikerjakan | Baca REQ |
|-----------------------------|----------|
| Fix bug login / logout / session | REQ-001 |
| Buat/edit ujian, soal, opsi | REQ-002 |
| Fix TakeExam, timer, submit | REQ-002 + REQ-003 |
| Input/rekap presensi | REQ-004 |
| CRUD alumni, chart alumni | REQ-005 |
| CRUD berita, landing page | REQ-006 |
| CRUD siswa/guru/kelas | REQ-007 |
| Dashboard stats, grafik | REQ-008 |
| Deploy, env, MySQL, CI/CD | REQ-009 |
| Komponen UI, toast, modal | REQ-010 |
| Fitur baru lintas-modul | Baca yang relevan saja |

---

## 📊 Status Implementasi

| Label | Status | Catatan |
|-------|--------|---------|
| `REQ-001` | ✅ Selesai | Login multi-role berjalan |
| `REQ-002` | ✅ ~90% | Export PDF/Excel perlu dicek |
| `REQ-003` | ✅ Selesai | Anti-cheat aktif |
| `REQ-004` | ⚠️ ~70% | Export Excel belum terhubung backend |
| `REQ-005` | ⚠️ ~75% | Paginasi belum ada |
| `REQ-006` | ⚠️ ~80% | Fitur preview belum |
| `REQ-007` | ✅ ~85% | Paginasi belum ada |
| `REQ-008` | ⚠️ ~70% | Error state silent perlu fix |
| `REQ-009` | 🟡 Sedang berjalan | Setup Hostinger Node.js + MySQL XAMPP dev, init migration & seed sudah committed |
| `REQ-010` | ⚠️ ~60% | 26 issue audit sedang di-fix |

---

*Update index ini setiap kali ada perubahan scope atau status implementasi.*