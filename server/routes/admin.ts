// server/routes/admin.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware';

const router = Router();
router.use(requireAuth, requireRole(['SUPER_ADMIN']));

router.get('/stats', async (req, res, next) => {
  try {
    const [totalSiswa, totalGuru, totalAlumni, totalUjian, totalBerita] = await Promise.all([
      prisma.siswa.count(),
      prisma.guru.count(),
      prisma.alumni.count(),
      prisma.ujian.count(),
      prisma.berita.count()
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presensiHariIni = await prisma.presensi.count({
      where: { tanggal: { gte: today } }
    });

    res.json({ totalSiswa, totalGuru, totalAlumni, totalUjian, totalBerita, presensiHariIni });
  } catch (error) {
    next(error);
  }
});

// Users
router.get('/users', async (req, res, next) => {
  try {
    const { role } = req.query;
    const whereCondition = role ? { role: String(role) } : {};
    const users = await prisma.user.findMany({
      where: whereCondition,
      include: {
        admin: true,
        guru: true,
        siswa: { include: { kelas: true } }
      }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { email, password, role, nama, nip, mataPelajaran, nis, kelasId } = req.body;

    if (!email || !password || !role || !nama) {
      return res.status(400).json({ error: 'Data wajib tidak lengkap' });
    }

    // Cek dupe natural key sebelum insert supaya pesan error jelas
    // ("NIS sudah dipakai siswa X") daripada P2002 dari Prisma yang generic.
    const emailExist = await prisma.user.findUnique({ where: { email } });
    if (emailExist) {
      return res.status(409).json({ error: `Email "${email}" sudah dipakai akun lain` });
    }
    if (role === 'SISWA' && nis) {
      const nisExist = await prisma.siswa.findUnique({ where: { nis: String(nis) } });
      if (nisExist) {
        return res.status(409).json({ error: `NIS "${nis}" sudah dipakai siswa lain — NIS harus unik` });
      }
    }
    if (role === 'GURU' && nip) {
      const nipExist = await prisma.guru.findUnique({ where: { nip: String(nip) } });
      if (nipExist) {
        return res.status(409).json({ error: `NIP "${nip}" sudah dipakai guru lain — NIP harus unik` });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(role === 'SUPER_ADMIN' ? { admin: { create: { nama } } } : {}),
        ...(role === 'GURU' ? { guru: { create: { nama, nip, mataPelajaran } } } : {}),
        ...(role === 'SISWA' ? { siswa: { create: { nama, nis, kelasId } } } : {})
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { email, isActive, nama, nis, nip, mataPelajaran, kelasId } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.params.id },
        data: {
          ...(email && { email }),
          ...(isActive !== undefined && { isActive })
        }
      });

      if (user.role === 'GURU') {
        await tx.guru.update({
          where: { userId: req.params.id },
          data: {
            ...(nama && { nama }),
            ...(nip && { nip }),
            ...(mataPelajaran && { mataPelajaran })
          }
        });
      } else if (user.role === 'SISWA') {
        await tx.siswa.update({
          where: { userId: req.params.id },
          data: {
            ...(nama && { nama }),
            ...(nis && { nis }),
            ...(kelasId && { kelasId })
          }
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ── Import: download template Excel (siswa | guru) ────────
router.get('/users/import-template', async (req, res, next) => {
  try {
    const type = String(req.query.type ?? '');
    if (type !== 'siswa' && type !== 'guru') {
      return res.status(400).json({ error: 'type harus "siswa" atau "guru"' });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(type === 'siswa' ? 'Template Siswa' : 'Template Guru');

    if (type === 'siswa') {
      // Kelas reference sheet — biar user bisa pilih dari daftar kelas yg ada
      const kelas = await prisma.kelas.findMany({ orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }] });

      ws.columns = [
        { header: 'NIS',        key: 'nis',       width: 16 },
        { header: 'Nama',       key: 'nama',      width: 32 },
        { header: 'Nama Kelas', key: 'kelas',     width: 24 },
      ];
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(1).eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        c.alignment = { horizontal: 'center' };
      });
      // Contoh baris
      ws.addRow({ nis: '2025010', nama: 'Contoh Nama Siswa', kelas: kelas[0]?.nama ?? 'X IPA 1' });

      // Sheet kedua: daftar kelas yg valid
      const refSheet = wb.addWorksheet('Daftar Kelas');
      refSheet.columns = [
        { header: 'Nama Kelas', key: 'nama',        width: 24 },
        { header: 'Tingkat',    key: 'tingkat',     width: 10 },
        { header: 'Tahun Ajaran', key: 'tahun',     width: 16 },
      ];
      refSheet.getRow(1).font = { bold: true };
      kelas.forEach(k => refSheet.addRow({ nama: k.nama, tingkat: k.tingkat, tahun: k.tahunAjaran }));
    } else {
      ws.columns = [
        { header: 'NIP',           key: 'nip',  width: 22 },
        { header: 'Nama',          key: 'nama', width: 32 },
        { header: 'Email',         key: 'email', width: 32 },
        { header: 'Mata Pelajaran', key: 'mapel', width: 22 },
        { header: 'Password (opsional)', key: 'password', width: 20 },
      ];
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(1).eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        c.alignment = { horizontal: 'center' };
      });
      ws.addRow({
        nip: '198000000000000000', nama: 'Contoh Nama Guru',
        email: 'contoh@sekolah.sch.id', mapel: 'Matematika', password: '',
      });
      // Note row
      const noteRow = ws.addRow([]);
      noteRow.getCell(1).value = 'Catatan: Kosongkan kolom Password untuk pakai default (NIP).';
      noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
      ws.mergeCells(`A${noteRow.number}:E${noteRow.number}`);
    }

    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="template-import-${type}.xlsx"`);
    res.send(Buffer.from(buf));
  } catch (error) {
    next(error);
  }
});

// ── Import: bulk insert siswa atau guru ────────────────────
// Body: { type: 'siswa'|'guru', items: Array<{...}> }
// Response: { created, skipped, failed: Array<{row, message}> }
router.post('/users/import', async (req, res, next) => {
  try {
    const { type, items } = req.body as { type?: string; items?: any[] };
    if (type !== 'siswa' && type !== 'guru') {
      return res.status(400).json({ error: 'type harus "siswa" atau "guru"' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items kosong' });
    }
    if (items.length > 500) {
      return res.status(400).json({ error: 'Maksimal 500 baris per import' });
    }

    let created = 0;
    let skipped = 0;
    const failed: { row: number; message: string }[] = [];

    if (type === 'siswa') {
      // Pre-load semua kelas untuk match by nama (case-insensitive)
      const kelasList = await prisma.kelas.findMany();
      const kelasByNama = new Map(kelasList.map(k => [k.nama.toLowerCase().trim(), k.id]));

      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const rowNumber = i + 2; // +2 karena header di row 1, data mulai row 2
        const nis = String(row.nis ?? '').trim();
        const nama = String(row.nama ?? '').trim();
        const kelasNama = String(row.kelas ?? '').trim();

        if (!nis || !nama || !kelasNama) {
          failed.push({ row: rowNumber, message: 'NIS, Nama, dan Nama Kelas wajib diisi' });
          continue;
        }
        const kelasId = kelasByNama.get(kelasNama.toLowerCase());
        if (!kelasId) {
          failed.push({ row: rowNumber, message: `Kelas "${kelasNama}" tidak ditemukan` });
          continue;
        }

        const email = `${nis}@siswa.sch.id`;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        try {
          const hashed = await bcrypt.hash(nis, 10);
          await prisma.user.create({
            data: {
              email, password: hashed, role: 'SISWA',
              siswa: { create: { nis, nama, kelasId } },
            },
          });
          created++;
        } catch (err: any) {
          failed.push({ row: rowNumber, message: err.message ?? 'Gagal insert' });
        }
      }
    } else {
      // type === 'guru'
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const rowNumber = i + 2;
        const nip = String(row.nip ?? '').trim();
        const nama = String(row.nama ?? '').trim();
        const email = String(row.email ?? '').trim();
        const mapel = String(row.mapel ?? row.mataPelajaran ?? '').trim();
        const password = String(row.password ?? '').trim();

        if (!nip || !nama || !email || !mapel) {
          failed.push({ row: rowNumber, message: 'NIP, Nama, Email, dan Mata Pelajaran wajib diisi' });
          continue;
        }
        if (!email.includes('@')) {
          failed.push({ row: rowNumber, message: 'Format email tidak valid' });
          continue;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        try {
          const hashed = await bcrypt.hash(password || nip, 10);
          await prisma.user.create({
            data: {
              email, password: hashed, role: 'GURU',
              guru: { create: { nip, nama, mataPelajaran: mapel } },
            },
          });
          created++;
        } catch (err: any) {
          failed.push({ row: rowNumber, message: err.message ?? 'Gagal insert' });
        }
      }
    }

    res.json({ created, skipped, failed });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { guru: true, siswa: true }
    });
    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    let resetTo = 'password123';
    if (user.role === 'SISWA' && user.siswa) resetTo = user.siswa.nis;
    else if (user.role === 'GURU' && user.guru?.nip) resetTo = user.guru.nip;

    const hashed = await bcrypt.hash(resetTo, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });

    res.json({ success: true, resetTo });
  } catch (error) {
    next(error);
  }
});

// Kelas (admin)
router.get('/kelas', async (req, res, next) => {
  try {
    const kelas = await prisma.kelas.findMany({
      include: {
        guru: { select: { id: true, nama: true } },
        _count: { select: { siswa: true } }
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }]
    });
    res.json(kelas);
  } catch (error) { next(error); }
});

router.post('/kelas', async (req, res, next) => {
  try {
    const { nama, tingkat, tahunAjaran, guruId } = req.body;
    if (!nama || !tingkat || !tahunAjaran || !guruId) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }
    const kelas = await prisma.kelas.create({ data: { nama, tingkat, tahunAjaran, guruId } });
    res.status(201).json(kelas);
  } catch (error) { next(error); }
});

router.patch('/kelas/:id', async (req, res, next) => {
  try {
    const { nama, tingkat, tahunAjaran, guruId } = req.body;
    const kelas = await prisma.kelas.update({
      where: { id: req.params.id },
      data: {
        ...(nama && { nama }),
        ...(tingkat && { tingkat }),
        ...(tahunAjaran && { tahunAjaran }),
        ...(guruId && { guruId })
      }
    });
    res.json(kelas);
  } catch (error) { next(error); }
});

router.delete('/kelas/:id', async (req, res, next) => {
  try {
    const jumlahSiswa = await prisma.siswa.count({ where: { kelasId: req.params.id } });
    if (jumlahSiswa > 0) {
      return res.status(400).json({ error: `Tidak bisa menghapus kelas yang masih memiliki ${jumlahSiswa} siswa` });
    }
    await prisma.kelas.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Berita CMS
router.get('/berita', async (req, res, next) => {
  try {
    const berita = await prisma.berita.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(berita);
  } catch(error) {
    next(error);
  }
});

router.post('/berita', async (req, res, next) => {
  try {
    const result = await prisma.berita.create({ data: req.body });
    res.status(201).json(result);
  } catch(error) {
    next(error);
  }
});

router.patch('/berita/:id', async (req, res, next) => {
  try {
    const result = await prisma.berita.update({ 
      where: { id: req.params.id },
      data: req.body 
    });
    res.json(result);
  } catch(error) {
    next(error);
  }
});

router.delete('/berita/:id', async (req, res, next) => {
  try {
    await prisma.berita.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(error) {
    next(error);
  }
});

// Alumni
router.get('/alumni', async (req, res, next) => {
  try {
    const alumni = await prisma.alumni.findMany({ orderBy: { tahunLulus: 'desc' } });
    res.json(alumni);
  } catch(error) {
    next(error);
  }
});

router.post('/alumni', async (req, res, next) => {
  try {
    // Admin-created alumni langsung verified (tidak perlu moderate diri sendiri).
    const result = await prisma.alumni.create({
      data: { ...req.body, isVerified: req.body.isVerified ?? true },
    });
    res.status(201).json(result);
  } catch(error) {
    next(error);
  }
});

// Batch verify / unverify alumni — dipakai admin di tracer untuk approve
// banyak alumni yang daftar via form publik sekaligus.
router.post('/alumni/verify', async (req, res, next) => {
  try {
    const { ids, isVerified } = req.body as { ids?: string[]; isVerified?: boolean };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids kosong' });
    }
    const result = await prisma.alumni.updateMany({
      where: { id: { in: ids } },
      data: { isVerified: isVerified !== false },
    });
    res.json({ success: true, updated: result.count });
  } catch (error) { next(error); }
});

router.patch('/alumni/:id', async (req, res, next) => {
  try {
    const result = await prisma.alumni.update({ 
      where: { id: req.params.id },
      data: req.body 
    });
    res.json(result);
  } catch(error) {
    next(error);
  }
});

router.delete('/alumni/:id', async (req, res, next) => {
  try {
    await prisma.alumni.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(error) {
    next(error);
  }
});

// ── Ujian (admin view-all + delete) ─────────────────────
// Admin punya hak baca semua ujian dari seluruh guru + bisa hapus
// untuk kepentingan housekeeping. Edit konten ujian/soal tetap di
// tangan guru pemilik via /api/guru/ujian/*.
router.get('/ujian', async (req, res, next) => {
  try {
    const ujianList = await prisma.ujian.findMany({
      include: {
        guru: { select: { id: true, nama: true, nip: true, mataPelajaran: true } },
        kelas: { include: { kelas: { select: { id: true, nama: true, tingkat: true } } } },
        _count: { select: { soal: true, sesiUjian: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ujianList);
  } catch (error) { next(error); }
});

router.get('/ujian/:id', async (req, res, next) => {
  try {
    const ujian = await prisma.ujian.findUnique({
      where: { id: req.params.id },
      include: {
        guru: { select: { id: true, nama: true, nip: true, mataPelajaran: true } },
        kelas: { include: { kelas: true } },
        soal: { include: { opsi: true }, orderBy: { nomor: 'asc' } },
        _count: { select: { sesiUjian: true } },
      },
    });
    if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' });
    res.json(ujian);
  } catch (error) { next(error); }
});

router.delete('/ujian/:id', async (req, res, next) => {
  try {
    const sesiCount = await prisma.sesiUjian.count({
      where: {
        ujianId: req.params.id,
        status: { in: ['SEDANG_BERLANGSUNG', 'SELESAI', 'AUTO_SUBMIT'] },
      },
    });
    if (sesiCount > 0) {
      return res.status(400).json({
        error: `Tidak bisa menghapus: ${sesiCount} siswa sudah mengerjakan ujian ini`,
      });
    }
    await prisma.ujian.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ── Import alumni: template Excel ──────────────────────
router.get('/alumni/import-template', async (req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Template Alumni');

    ws.columns = [
      { header: 'Nama',         key: 'nama',       width: 28 },
      { header: 'NIS',          key: 'nis',        width: 14 },
      { header: 'Tahun Lulus',  key: 'tahunLulus', width: 14 },
      { header: 'Jurusan',      key: 'jurusan',    width: 18 },
      { header: 'Status',       key: 'status',     width: 16 },
      { header: 'Instansi',     key: 'instansi',   width: 24 },
      { header: 'Posisi',       key: 'posisi',     width: 22 },
      { header: 'Kontak',       key: 'kontak',     width: 24 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      c.alignment = { horizontal: 'center' };
    });

    ws.addRow({
      nama: 'Contoh Nama Alumni', nis: '2021001', tahunLulus: 2024,
      jurusan: 'IPA', status: 'KULIAH', instansi: 'Universitas Indonesia',
      posisi: 'Mahasiswa Teknik', kontak: '08123456789',
    });

    const noteRow = ws.addRow([]);
    noteRow.getCell(1).value = 'Status valid: BEKERJA, KULIAH, WIRAUSAHA, TIDAK_DIKETAHUI. Wajib: Nama, Tahun Lulus, Status.';
    noteRow.getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
    ws.mergeCells(`A${noteRow.number}:H${noteRow.number}`);

    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-import-alumni.xlsx"');
    res.send(Buffer.from(buf));
  } catch (error) { next(error); }
});

// ── Import alumni: bulk insert ─────────────────────────
router.post('/alumni/import', async (req, res, next) => {
  try {
    const { items } = req.body as { items?: any[] };
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items kosong' });
    }
    if (items.length > 500) {
      return res.status(400).json({ error: 'Maksimal 500 baris per import' });
    }

    const VALID_STATUS = new Set(['BEKERJA', 'KULIAH', 'WIRAUSAHA', 'TIDAK_DIKETAHUI']);

    let created = 0;
    let skipped = 0;
    const failed: { row: number; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowNumber = i + 2;
      const nama = String(row.nama ?? '').trim();
      const nis = String(row.nis ?? '').trim() || null;
      const tahunLulusRaw = row.tahunLulus;
      const tahunLulus = Number(tahunLulusRaw);
      const jurusan = String(row.jurusan ?? '').trim() || null;
      const status = String(row.status ?? '').trim().toUpperCase();
      const instansi = String(row.instansi ?? '').trim() || null;
      const posisi = String(row.posisi ?? '').trim() || null;
      const kontak = String(row.kontak ?? '').trim() || null;

      if (!nama || !tahunLulusRaw || !status) {
        failed.push({ row: rowNumber, message: 'Nama, Tahun Lulus, dan Status wajib diisi' });
        continue;
      }
      if (!Number.isFinite(tahunLulus) || tahunLulus < 1900 || tahunLulus > 2100) {
        failed.push({ row: rowNumber, message: `Tahun Lulus "${tahunLulusRaw}" tidak valid` });
        continue;
      }
      if (!VALID_STATUS.has(status)) {
        failed.push({ row: rowNumber, message: `Status "${status}" tidak valid (BEKERJA/KULIAH/WIRAUSAHA/TIDAK_DIKETAHUI)` });
        continue;
      }

      // Idempotent: kalau ada NIS yang sama, skip (NIS bukan unique di schema tapi
      // di-treat sebagai natural key untuk import)
      if (nis) {
        const existing = await prisma.alumni.findFirst({ where: { nis } });
        if (existing) { skipped++; continue; }
      }

      try {
        await prisma.alumni.create({
          data: { nama, nis, tahunLulus, jurusan, status, instansi, posisi, kontak },
        });
        created++;
      } catch (err: any) {
        failed.push({ row: rowNumber, message: err.message ?? 'Gagal insert' });
      }
    }

    res.json({ created, skipped, failed });
  } catch (error) { next(error); }
});

router.get('/alumni/export', async (req, res, next) => {
  try {
    const alumni = await prisma.alumni.findMany({ orderBy: [{ tahunLulus: 'desc' }, { nama: 'asc' }] });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data Alumni');

    ws.columns = [
      { width: 5 }, { width: 28 }, { width: 14 }, { width: 10 },
      { width: 20 }, { width: 16 }, { width: 24 }, { width: 22 }, { width: 24 }
    ];

    ws.mergeCells('A1:I1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'DATA ALUMNI';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    ws.addRow([]);

    const hRow = ws.addRow(['No', 'Nama', 'NIS', 'Thn Lulus', 'Jurusan', 'Status', 'Instansi', 'Posisi', 'Kontak']);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.alignment = { horizontal: 'center' };
    });

    const statusLabel: Record<string, string> = {
      BEKERJA: 'Bekerja', KULIAH: 'Kuliah',
      WIRAUSAHA: 'Wirausaha', TIDAK_DIKETAHUI: 'Tidak Diketahui'
    };

    alumni.forEach((al, idx) => {
      ws.addRow([
        idx + 1, al.nama, al.nis ?? '-', al.tahunLulus,
        al.jurusan ?? '-', statusLabel[al.status] ?? al.status,
        al.instansi ?? '-', al.posisi ?? '-', al.kontak ?? '-'
      ]);
    });

    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="data-alumni.xlsx"');
    res.send(Buffer.from(buf));
  } catch(error) {
    next(error);
  }
});

// ── SiteConfig (admin update) ──────────────────────────
// Whitelist field — biar request body tidak bisa nyelundupin field
// yang tidak diinginkan (misal id, updatedAt).
const SITE_CONFIG_FIELDS = [
  'namaSekolah', 'tagline', 'deskripsi',
  'logoUrl', 'faviconUrl', 'heroImageUrl',
  'heroBadge', 'heroTitle', 'heroSubtitle',
  'profilImageUrl', 'sejarah',
  'visi', 'misi', 'tujuan',
  'alamat', 'telepon', 'email', 'whatsapp',
  'facebook', 'instagram', 'twitter', 'youtube', 'tiktok',
] as const;

router.patch('/site-config', async (req, res, next) => {
  try {
    const data: Record<string, any> = {};
    for (const key of SITE_CONFIG_FIELDS) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({ data });
    } else {
      config = await prisma.siteConfig.update({
        where: { id: config.id },
        data,
      });
    }
    res.json(config);
  } catch (error) { next(error); }
});

export default router;
