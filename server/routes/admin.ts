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
    const result = await prisma.alumni.create({ data: req.body });
    res.status(201).json(result);
  } catch(error) {
    next(error);
  }
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

export default router;
