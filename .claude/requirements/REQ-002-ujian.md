# REQ-002 — Sistem Ujian Online

**Label:** `REQ-002`  
**Area:** Buat ujian, soal, sesi, submit, nilai  
**Status:** ✅ ~90% (export PDF/Excel perlu dicek)

---

## Aktor

- **GURU** → buat & kelola ujian, soal, lihat hasil
- **SISWA** → kerjakan ujian, lihat hasil

---

## Tipe Soal

| Tipe | Kode | Pilihan Jawaban | Penilaian |
|------|------|-----------------|-----------|
| Pilihan Ganda | `PILIHAN_GANDA` | 4-6 opsi, 1 benar | Benar = poin penuh |
| PG Kompleks | `PG_KOMPLEKS` | 4 opsi, ≥1 benar | Semua benar dipilih & tidak ada salah = poin penuh |
| Benar/Salah | `BENAR_SALAH` | 2 opsi fixed | Benar = poin penuh |

---

## Flow Guru

```
BuatUjian → pilih kelas, durasi, jadwal, opsi acak
  ↓
KelolaSoal → tambah/edit/hapus soal + opsi
  ↓
DaftarUjian → monitor status, edit info, lihat hasil
  ↓
RekapNilai → lihat nilai per siswa, export Excel/PDF
```

## Flow Siswa

```
ExamList → lihat ujian aktif (dalam window tanggalMulai-tanggalSelesai)
  ↓
POST /api/siswa/ujian/:id/mulai → buat SesiUjian, return sessionId
  ↓
TakeExam → kerjakan soal, auto-save jawaban
  ↓
Submit → POST /api/siswa/sesi/:id/submit → hitung nilai otomatis
  ↓
HasilUjian → tampilkan nilai & detail jawaban
```

---

## Status Sesi Ujian

`BELUM_MULAI` → `SEDANG_BERLANGSUNG` → `SELESAI` atau `AUTO_SUBMIT`

**AUTO_SUBMIT** terjadi karena:
- Waktu habis (timer = 0)
- Pelanggaran anti-cheat mencapai batas (reason: "auto_cheat")

---

## File Terkait

**Frontend:**
- `src/pages/dashboard/guru/BuatUjian.tsx`
- `src/pages/dashboard/guru/KelolaSoal.tsx`
- `src/pages/dashboard/guru/DaftarUjian.tsx`
- `src/pages/dashboard/guru/RekapNilai.tsx`
- `src/pages/dashboard/ExamList.tsx`
- `src/pages/exam/TakeExam.tsx`
- `src/pages/dashboard/siswa/HasilUjian.tsx`

**Backend:**
- `server/routes/guru.ts` → CRUD ujian & soal, hasil, export
- `server/routes/siswa.ts` → mulai sesi, jawab, submit

---

## Endpoint Utama

```
GET/POST        /api/guru/ujian
GET/PATCH/DEL   /api/guru/ujian/:id
GET/POST        /api/guru/ujian/:id/soal
PATCH/DEL       /api/guru/soal/:soalId
GET             /api/guru/ujian/:id/hasil
GET             /api/guru/ujian/:id/export?format=xlsx|pdf

GET             /api/siswa/ujian-aktif
POST            /api/siswa/ujian/:id/mulai
GET             /api/siswa/sesi/:id
POST            /api/siswa/sesi/:id/jawab
POST            /api/siswa/sesi/:id/submit
```

---

## Kalkulasi Nilai

```
nilaiAkhir = (totalPoinBenar / totalPoinSemua) * 100
```

Dibulatkan 2 desimal. Disimpan di `SesiUjian.nilaiAkhir`.