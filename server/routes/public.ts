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

router.get('/alumni/stats', async (req, res, next) => {
  try {
    const alumniList = await prisma.alumni.findMany();

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
