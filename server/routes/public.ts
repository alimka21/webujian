// server/routes/public.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/berita', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const data = await prisma.berita.findMany({
      where: { status: 'PUBLISHED' },
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' }
    });

    const total = await prisma.berita.count({ where: { status: 'PUBLISHED' } });

    res.json({ data, total, page, limit });
  } catch(error) { next(error); }
});

router.get('/berita/:slug', async (req, res, next) => {
  try {
    const berita = await prisma.berita.findUnique({
      where: { slug: req.params.slug }
    });
    if (!berita || berita.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Berita tidak ditemukan' });
    }
    res.json(berita);
  } catch(error) { next(error); }
});

// Singleton: SiteConfig untuk landing page. Auto-create kalau belum ada.
router.get('/site-config', async (req, res, next) => {
  try {
    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({ data: {} });
    }
    res.json(config);
  } catch (error) { next(error); }
});

// Public form: alumni daftar diri sendiri. Tidak butuh auth.
// Status default TIDAK_DIKETAHUI sampai admin verifikasi/update.
// Anti-spam ringan: cek duplikasi by NIS (kalau diisi) + size limit body.
const VALID_ALUMNI_STATUS = new Set(['BEKERJA', 'KULIAH', 'WIRAUSAHA', 'TIDAK_DIKETAHUI']);
router.post('/alumni/register', async (req, res, next) => {
  try {
    const { nama, nis, tahunLulus, jurusan, status, instansi, posisi, kontak } = req.body;

    // Validasi minimum
    if (!nama || typeof nama !== 'string' || nama.trim().length < 3) {
      return res.status(400).json({ error: 'Nama wajib diisi (min 3 karakter)' });
    }
    const tahun = Number(tahunLulus);
    if (!Number.isFinite(tahun) || tahun < 1900 || tahun > 2100) {
      return res.status(400).json({ error: 'Tahun lulus tidak valid' });
    }
    const finalStatus = String(status ?? 'TIDAK_DIKETAHUI').toUpperCase();
    if (!VALID_ALUMNI_STATUS.has(finalStatus)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    // Idempotent ringan: kalau NIS diisi & sudah ada, return error supaya
    // tidak duplikat. Tanpa NIS, alumni baru selalu di-insert (admin yang
    // verifikasi belakangan).
    const cleanNis = nis ? String(nis).trim() : null;
    if (cleanNis) {
      const existing = await prisma.alumni.findFirst({ where: { nis: cleanNis } });
      if (existing) {
        return res.status(409).json({
          error: 'Data dengan NIS ini sudah terdaftar. Hubungi admin sekolah jika perlu perubahan.',
        });
      }
    }

    const created = await prisma.alumni.create({
      data: {
        nama: nama.trim(),
        nis: cleanNis,
        tahunLulus: tahun,
        jurusan: jurusan ? String(jurusan).trim() || null : null,
        status: finalStatus,
        instansi: instansi ? String(instansi).trim() || null : null,
        posisi: posisi ? String(posisi).trim() || null : null,
        kontak: kontak ? String(kontak).trim() || null : null,
      },
    });
    res.status(201).json({ success: true, id: created.id });
  } catch (error) { next(error); }
});

router.get('/alumni/stats', async (req, res, next) => {
  try {
    // Hanya hitung alumni yang sudah diverifikasi admin
    const alumniList = await prisma.alumni.findMany({ where: { isVerified: true } });

    const perTahun: Record<number, number> = {};
    const perStatus: Record<string, number> = {};

    alumniList.forEach(a => {
      perTahun[a.tahunLulus] = (perTahun[a.tahunLulus] || 0) + 1;
      perStatus[a.status] = (perStatus[a.status] || 0) + 1;
    });

    res.json({ perTahun, perStatus });
  } catch(error) { next(error); }
});

export default router;
