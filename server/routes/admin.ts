// server/routes/admin.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
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
    const { email, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        ...(email && { email }), 
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json(user);
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

export default router;
