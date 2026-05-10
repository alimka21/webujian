// server/routes/siswa.ts
import { Router } from 'express';
import { prisma } from '../../src/lib/prisma';
import { requireAuth, requireRole } from '../middleware';

const router = Router();
router.use(requireAuth, requireRole(['SISWA']));

router.get('/dashboard', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { userId: (req.user as any).userId } });
    if (!siswa) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

    const now = new Date();

    const ujianAktifRecords = await prisma.ujianKelas.findMany({
      where: {
        kelasId: siswa.kelasId,
        ujian: {
          tanggalMulai: { lte: now },
          tanggalSelesai: { gte: now }
        }
      },
      include: {
        ujian: {
          include: { 
            sesiUjian: { where: { siswaId: siswa.id } }
          }
        }
      }
    });

    const ujianAktif = ujianAktifRecords
      .filter((uk) => {
        const sesi = uk.ujian.sesiUjian[0];
        return !sesi || (sesi.status !== 'SELESAI' && sesi.status !== 'AUTO_SUBMIT');
      })
      .map(uk => uk.ujian);

    const sesiSelesai = await prisma.sesiUjian.findMany({
      where: {
        siswaId: siswa.id,
        status: { in: ['SELESAI', 'AUTO_SUBMIT'] }
      },
      include: { ujian: true }
    });

    const avg = sesiSelesai.length > 0 
      ? sesiSelesai.reduce((a, b) => a + (b.nilaiAkhir || 0), 0) / sesiSelesai.length 
      : 0;

    res.json({
      ujianAktif,
      ujianSelesai: sesiSelesai,
      rataRataNilai: Math.round(avg * 10) / 10
    });
  } catch (error) { next(error); }
});

router.get('/ujian-aktif', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { userId: (req.user as any).userId } });
    const now = new Date();

    const records = await prisma.ujianKelas.findMany({
      where: {
        kelasId: siswa?.kelasId,
        ujian: {
          tanggalMulai: { lte: now },
          tanggalSelesai: { gte: now }
        }
      },
      include: {
        ujian: {
          include: { sesiUjian: { where: { siswaId: siswa?.id } } }
        }
      }
    });

    const result = records
      .filter((uk) => {
        const sesi = uk.ujian.sesiUjian[0];
        return !sesi || (sesi.status !== 'SELESAI' && sesi.status !== 'AUTO_SUBMIT');
      })
      .map(uk => uk.ujian);

    res.json(result);
  } catch(error) { next(error); }
});

router.post('/ujian/:ujianId/mulai', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { userId: (req.user as any).userId } });
    if(!siswa) return res.status(404).json({error: 'Siswa not found'});

    const ujian = await prisma.ujian.findUnique({ where: { id: req.params.ujianId } });
    if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    // Validate class
    const validKelas = await prisma.ujianKelas.findUnique({
      where: { ujianId_kelasId: { ujianId: ujian.id, kelasId: siswa.kelasId } }
    });
    if (!validKelas) return res.status(403).json({ error: 'Tidak dapat mengakses ujian ini.' });

    const now = new Date();
    if (ujian.tanggalMulai && now < ujian.tanggalMulai) {
      return res.status(400).json({ error: 'Ujian belum dimulai' });
    }
    if (ujian.tanggalSelesai && now > ujian.tanggalSelesai) {
      return res.status(400).json({ error: 'Waktu ujian sudah habis' });
    }

    let sesi = await prisma.sesiUjian.findUnique({
      where: { ujianId_siswaId: { ujianId: ujian.id, siswaId: siswa.id } }
    });

    if (!sesi) {
      sesi = await prisma.sesiUjian.create({
        data: {
          ujianId: ujian.id,
          siswaId: siswa.id,
          status: 'SEDANG_BERLANGSUNG',
          mulaiAt: now
        }
      });
    } else {
      if (sesi.status === 'BELUM_MULAI') {
        sesi = await prisma.sesiUjian.update({
          where: { id: sesi.id },
          data: { status: 'SEDANG_BERLANGSUNG', mulaiAt: now }
        });
      }
    }

    res.json({ sessionId: sesi.id });
  } catch(error) { next(error); }
});

router.get('/sesi/:sessionId', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { userId: (req.user as any).userId } });
    if (!siswa) return res.status(404).json({ error: 'Not found' });

    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: req.params.sessionId },
      include: {
        ujian: {
          include: {
            soal: {
              orderBy: { nomor: 'asc' },
              include: { 
                opsi: { orderBy: { urutan: 'asc' }, select: { id: true, teks: true, imageUrl: true, urutan: true } }
              }
            }
          }
        },
        jawaban: true
      }
    });

    if (!sesi || sesi.siswaId !== siswa.id) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan atau akses ditolak' });
    }

    res.json({
      sesi: {
        id: sesi.id,
        status: sesi.status,
        terjawab: sesi.jawaban
      },
      ujian: {
        judul: sesi.ujian.judul,
        durasi: sesi.ujian.durasi,
        soal: sesi.ujian.soal
      }
    });
  } catch(error) { next(error); }
});

router.post('/sesi/:sessionId/jawab', async (req, res, next) => {
  try {
    const { soalId, opsiIds } = req.body;
    if (!opsiIds || opsiIds.length === 0) return res.json({ success: true }); // No answer selected

    await prisma.jawaban.deleteMany({
      where: { sesiId: req.params.sessionId, soalId }
    });

    // Strategy 1: insert multiple record if PG_KOMPLEKS, but our model Jawaban has relation per `opsiId`
    // If opsis are multiple, we create multiple Jawaban records
    await prisma.jawaban.createMany({
      data: opsiIds.map((id: string) => ({
        sesiId: req.params.sessionId,
        soalId,
        opsiId: id,
        isBenar: false // It will be recalculated later upon submit
      }))
    });

    res.json({ success: true });
  } catch(error) { next(error); }
});

router.post('/sesi/:sessionId/submit', async (req, res, next) => {
  try {
    const { reason } = req.body; // 'manual', 'timeout', 'auto_cheat'
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: req.params.sessionId },
      include: {
        ujian: { include: { soal: { include: { opsi: true } } } },
        jawaban: true
      }
    });

    if (!sesi) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    if (sesi.status === "SELESAI" || sesi.status === "AUTO_SUBMIT") {
      return res.status(400).json({ error: "Sesi sudah disubmit" });
    }

    let totalPoin = 0;
    let poinBenar = 0;

    for (const soal of sesi.ujian.soal) {
      totalPoin += soal.poin;
      const jawabanUser = sesi.jawaban.filter(j => j.soalId === soal.id).map(j => j.opsiId);
      const opsiBenar = soal.opsi.filter(o => o.benar).map(o => o.id);

      let isBenar = false;

      if (soal.tipe === "PILIHAN_GANDA" || soal.tipe === "BENAR_SALAH") {
        isBenar = jawabanUser.length === 1 && jawabanUser[0] === opsiBenar[0];
      } else if (soal.tipe === "PG_KOMPLEKS") {
        const setBenar = new Set(opsiBenar);
        const setJawab = new Set(jawabanUser.filter(Boolean) as string[]);
        isBenar = setBenar.size === setJawab.size && [...setBenar].every(id => setJawab.has(id));
      }

      if (isBenar) poinBenar += soal.poin;
    }

    const nilaiAkhir = totalPoin > 0 ? (poinBenar / totalPoin) * 100 : 0;
    const finalStatus = reason === "auto_cheat" ? "AUTO_SUBMIT" : "SELESAI";

    await prisma.sesiUjian.update({
      where: { id: sesi.id },
      data: {
        status: finalStatus,
        selesaiAt: new Date(),
        nilaiRaw: poinBenar,
        nilaiAkhir: Math.round(nilaiAkhir * 100) / 100,
        submitReason: reason || "manual"
      }
    });

    res.json({ success: true, nilaiAkhir, benar: poinBenar, total: totalPoin });
  } catch(error) { next(error); }
});

router.post('/sesi/:sessionId/violation', async (req, res, next) => {
  try {
    const { tipe, pesan } = req.body;
    await prisma.pelanggaran.create({
      data: {
        sesiId: req.params.sessionId,
        tipe, pesan, timestamp: new Date()
      }
    });
    res.json({ success: true });
  } catch(error) { next(error); }
});

router.get('/hasil', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { userId: (req.user as any).userId } });
    const sesi = await prisma.sesiUjian.findMany({
      where: { siswaId: siswa?.id, status: { in: ['SELESAI', 'AUTO_SUBMIT'] } },
      include: {
        ujian: { select: { judul: true, mataPelajaran: true, durasi: true } }
      },
      orderBy: { selesaiAt: 'desc' }
    });
    res.json(sesi);
  } catch(error) { next(error); }
});

export default router;
