// server/routes/guru.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware';

const router = Router();
router.use(requireAuth, requireRole(['GURU']));

router.get('/stats', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    if (!guru) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const totalUjian = await prisma.ujian.count({ where: { guruId: guru.id } });
    
    // Total Siswa dari kelas yang diajar
    const kelasArr = await prisma.kelas.findMany({ where: { guruId: guru.id } });
    const kelasIds = kelasArr.map(k => k.id);
    const totalSiswa = await prisma.siswa.count({ where: { kelasId: { in: kelasIds } } });

    // Rata-rata nilai: ambil semua sesiUjian dari ujian yang dibuat guru ini
    const sesiSelesai = await prisma.sesiUjian.findMany({
      where: { 
        status: { in: ['SELESAI', 'AUTO_SUBMIT'] },
        ujian: { guruId: guru.id }
      },
      select: { nilaiAkhir: true }
    });

    const avg = sesiSelesai.length > 0 
      ? sesiSelesai.reduce((a, b) => a + (b.nilaiAkhir || 0), 0) / sesiSelesai.length 
      : 0;

    const now = new Date();
    const ujianAktif = await prisma.ujian.count({
      where: {
        guruId: guru.id,
        tanggalMulai: { lte: now },
        tanggalSelesai: { gte: now }
      }
    });

    res.json({ totalUjian, totalSiswa, rataRataNilai: Math.round(avg * 10) / 10, ujianAktif });
  } catch (error) {
    next(error);
  }
});

router.get('/kelas', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    const kelas = await prisma.kelas.findMany({ 
      where: { guruId: guru?.id },
      include: { _count: { select: { siswa: true } } }
    });
    res.json(kelas);
  } catch (error) {
    next(error);
  }
});

router.post('/kelas', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    if (!guru) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const result = await prisma.kelas.create({
      data: { ...req.body, guruId: guru.id }
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/kelas/:id', async (req, res, next) => {
  try {
    const result = await prisma.kelas.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(result);
  } catch(error) { next(error); }
});

router.delete('/kelas/:id', async (req, res, next) => {
  try {
    await prisma.kelas.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(error) { next(error); }
});

// Siswa 
router.get('/siswa', async (req, res, next) => {
  try {
    const { kelasId } = req.query;
    if (!kelasId) return res.status(400).json({ error: 'kelasId diperlukan' });
    const siswa = await prisma.siswa.findMany({ where: { kelasId: String(kelasId) }, include: { user: true } });
    res.json(siswa);
  } catch(error) { next(error); }
});

router.post('/siswa', async (req, res, next) => {
  try {
    const { nis, nama, kelasId } = req.body;
    const password = await bcrypt.hash(nis, 10);
    const email = `${nis}@siswa.sch.id`;

    const result = await prisma.user.create({
      data: {
        email, password, role: 'SISWA',
        siswa: { create: { nis, nama, kelasId } }
      },
      include: { siswa: true }
    });
    res.status(201).json(result.siswa);
  } catch(error) { next(error); }
});

router.patch('/siswa/:id', async (req, res, next) => {
  try {
    const result = await prisma.siswa.update({ where: { id: req.params.id }, data: req.body });
    res.json(result);
  } catch(error) { next(error); }
});

router.delete('/siswa/:id', async (req, res, next) => {
  try {
    const siswa = await prisma.siswa.findUnique({ where: { id: req.params.id } });
    if(siswa) await prisma.user.delete({ where: { id: siswa.userId } });
    res.json({ success: true });
  } catch(error) { next(error); }
});

// Ujian
router.get('/ujian', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    const ujianList = await prisma.ujian.findMany({
      where: { guruId: guru?.id },
      include: {
        kelas: { include: { kelas: true } },
        _count: { select: { soal: true, sesiUjian: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ujianList);
  } catch(error) { next(error); }
});

router.post('/ujian', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    const { judul, mataPelajaran, tipeUjian, durasi, tanggalMulai, tanggalSelesai, acak, kelasIds } = req.body;
    
    if (!judul || !mataPelajaran || !durasi || !tanggalMulai || !tanggalSelesai) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    const ujian = await prisma.ujian.create({
      data: { 
        judul, mataPelajaran, tipeUjian,
        durasi: Number(durasi),
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        acak: !!acak,
        guruId: guru!.id,
        kelas: {
          create: (kelasIds || []).map((kId: string) => ({ kelasId: kId }))
        }
      }
    });
    res.json(ujian);
  } catch(error) { next(error); }
});

router.get('/ujian/:id', async (req, res, next) => {
  try {
    const ujian = await prisma.ujian.findUnique({
      where: { id: req.params.id },
      include: { soal: { include: { opsi: true }, orderBy: { nomor: 'asc' } } }
    });
    if(!ujian) return res.status(404).json({error:"Not found"});
    res.json(ujian);
  } catch(error) { next(error); }
});

router.patch('/ujian/:id', async (req, res, next) => {
  try {
    const { judul, mataPelajaran, tipeUjian, durasi, tanggalMulai, tanggalSelesai, acak, kelasIds } = req.body;
    
    // Hapus relasi UjianKelas lama
    if (kelasIds) {
      await prisma.ujianKelas.deleteMany({ where: { ujianId: req.params.id } });
    }

    const updated = await prisma.ujian.update({
      where: { id: req.params.id },
      data: {
        ...(judul && {judul}),
        ...(mataPelajaran && {mataPelajaran}),
        ...(tipeUjian && {tipeUjian}),
        ...(durasi && {durasi: Number(durasi)}),
        ...(tanggalMulai && {tanggalMulai: new Date(tanggalMulai)}),
        ...(tanggalSelesai && {tanggalSelesai: new Date(tanggalSelesai)}),
        ...(acak !== undefined && {acak: !!acak}),
        ...(kelasIds && {
          kelas: { create: kelasIds.map((c: string) => ({ kelasId: c })) }
        })
      }
    });
    res.json(updated);
  } catch(error) { next(error); }
});

router.delete('/ujian/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const sesiCount = await prisma.sesiUjian.count({
      where: { ujianId: id, status: { in: ["BERJALAN", "SEDANG_BERLANGSUNG", "SELESAI", "AUTO_SUBMIT"] } }
    });
    
    if (sesiCount > 0) {
      return res.status(400).json({ error: "Tidak bisa menghapus ujian yang sudah dikerjakan siswa" });
    }

    await prisma.ujian.delete({ where: { id: id } });
    res.json({ success: true });
  } catch(error) { next(error); }
});

router.post('/ujian/:id/duplikat', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    if (!guru) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const source = await prisma.ujian.findUnique({
      where: { id: req.params.id },
      include: {
        soal: { include: { opsi: true }, orderBy: { nomor: 'asc' } },
        kelas: true
      }
    });
    if (!source) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    const copy = await prisma.$transaction(async (tx) => {
      return tx.ujian.create({
        data: {
          judul: `${source.judul} (Salinan)`,
          mataPelajaran: source.mataPelajaran,
          tipeUjian: source.tipeUjian,
          durasi: source.durasi,
          tanggalMulai: source.tanggalMulai,
          tanggalSelesai: source.tanggalSelesai,
          acak: source.acak,
          guruId: guru.id,
          kelas: { create: source.kelas.map(k => ({ kelasId: k.kelasId })) },
          soal: {
            create: source.soal.map(s => ({
              nomor: s.nomor,
              teks: s.teks,
              imageUrl: s.imageUrl,
              tipe: s.tipe,
              poin: s.poin,
              opsi: {
                create: s.opsi.map(o => ({
                  teks: o.teks,
                  imageUrl: o.imageUrl,
                  urutan: o.urutan,
                  benar: o.benar
                }))
              }
            }))
          }
        }
      });
    });

    res.json(copy);
  } catch(error) { next(error); }
});

// Soal routes
router.get('/ujian/:id/soal', async (req, res, next) => {
  try {
    const soal = await prisma.soal.findMany({ where: { ujianId: req.params.id }, include: { opsi: true }, orderBy: {nomor: 'asc'} });
    res.json(soal);
  } catch(e) { next(e); }
});

router.post('/ujian/:id/soal', async (req, res, next) => {
  try {
    const { teks, imageUrl, tipe, opsi, poin } = req.body;
    
    if (!teks?.trim()) return res.status(400).json({ error: "Teks soal tidak boleh kosong" });
    if (!opsi || opsi.length < 2) return res.status(400).json({ error: "Minimal 2 opsi jawaban" });
    if (!opsi.some((o: any) => o.benar)) return res.status(400).json({ error: "Pilih minimal satu jawaban benar" });
    
    const count = await prisma.soal.count({ where: { ujianId: req.params.id } });
    const soal = await prisma.soal.create({
      data: {
        ujianId: req.params.id,
        nomor: count + 1,
        teks, imageUrl, tipe, poin: Number(poin || 1),
        opsi: {
          create: opsi.map((o: any, i: number) => ({
            teks: o.teks, imageUrl: o.imageUrl, urutan: i + 1, benar: o.benar
          }))
        }
      },
      include: { opsi: true }
    });
    res.status(201).json(soal);
  } catch(error) { next(error); }
});

router.patch('/soal/:id', async (req, res, next) => {
  try {
    const { teks, imageUrl, tipe, opsi, poin } = req.body;
    const updated = await prisma.$transaction(async (tx) => {
      // Hapus opsi lama
      await tx.opsi.deleteMany({ where: { soalId: req.params.id } });
      // Update soal & buat opsi baru
      return tx.soal.update({
        where: { id: req.params.id },
        data: {
          teks, imageUrl: imageUrl ?? null, tipe, poin: poin ? Number(poin) : 1,
          opsi: {
            create: opsi.map((o: any, i: number) => ({
              teks: o.teks, imageUrl: o.imageUrl ?? null, urutan: i + 1, benar: o.benar
            }))
          }
        },
        include: { opsi: true }
      });
    });
    res.json(updated);
  } catch(error) { next(error); }
});

router.delete('/soal/:id', async (req, res, next) => {
  try {
    const soalId = req.params.id;
    const soal = await prisma.soal.findUnique({ where: { id: soalId } });
    if (!soal) return res.status(404).json({ error: "Soal tidak ditemukan" });

    await prisma.soal.delete({ where: { id: soalId } });
    
    // Renumber sisa soal
    const remaining = await prisma.soal.findMany({
      where: { ujianId: soal.ujianId },
      orderBy: { nomor: "asc" }
    });
    
    await Promise.all(
      remaining.map((s, i) =>
        prisma.soal.update({ where: { id: s.id }, data: { nomor: i + 1 } })
      )
    );

    res.json({ success: true });
  } catch(error) { next(error); }
});

router.get('/ujian/:id/hasil', async (req, res, next) => {
  try {
    const ujian = await prisma.ujian.findUnique({
      where: { id: req.params.id }, 
      include: { kelas: true }
    });
    if (!ujian) return res.status(404).json({ error: 'Not found' });

    const kelasIds = ujian.kelas.map(k => k.kelasId);
    
    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: {
        kelas: true,
        sesiUjian: {
          where: { ujianId: ujian.id },
          include: { pelanggaran: true }
        }
      }
    });

    const result = siswaList.map(s => {
      const sesi = s.sesiUjian[0];
      return {
        siswa: { id: s.id, nama: s.nama, nis: s.nis, kelas: s.kelas },
        sesiId: sesi?.id || null,
        nilaiAkhir: sesi?.nilaiAkhir ?? null,
        nilaiRaw: sesi?.nilaiRaw ?? null,
        status: sesi?.status ?? 'BELUM_MULAI',
        submitReason: sesi?.submitReason ?? null,
        mulaiAt: sesi?.mulaiAt ?? null,
        selesaiAt: sesi?.selesaiAt ?? null,
        pelanggaran: sesi?.pelanggaran || []
      }
    });
    
    res.json(result);
  } catch(error) { next(error); }
});

// Detail jawaban per sesi (untuk modal)
router.get('/ujian/:id/sesi/:sesiId', async (req, res, next) => {
  try {
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: req.params.sesiId },
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        jawaban: {
          include: {
            soal: { include: { opsi: { orderBy: { urutan: 'asc' } } } },
            opsi: true
          }
        }
      }
    });
    if (!sesi || sesi.ujianId !== req.params.id) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    const soalList = await prisma.soal.findMany({
      where: { ujianId: req.params.id },
      include: { opsi: { orderBy: { urutan: 'asc' } } },
      orderBy: { nomor: 'asc' }
    });

    const jawabanMap = new Map(sesi.jawaban.map(j => [j.soalId, j]));

    const detail = soalList.map(soal => {
      const jwb = jawabanMap.get(soal.id);
      const opsiBenar = soal.opsi.find(o => o.benar);
      return {
        nomor: soal.nomor,
        teks: soal.teks,
        tipe: soal.tipe,
        poin: soal.poin,
        opsiDipilih: jwb?.opsi ? { id: jwb.opsi.id, teks: jwb.opsi.teks } : null,
        opsiBenar: opsiBenar ? { id: opsiBenar.id, teks: opsiBenar.teks } : null,
        isBenar: jwb?.isBenar ?? false,
        tidakDijawab: !jwb
      };
    });

    res.json({
      siswa: sesi.siswa,
      sesi: {
        id: sesi.id,
        nilaiAkhir: sesi.nilaiAkhir,
        nilaiRaw: sesi.nilaiRaw,
        status: sesi.status,
        submitReason: sesi.submitReason,
        mulaiAt: sesi.mulaiAt,
        selesaiAt: sesi.selesaiAt
      },
      detail
    });
  } catch(error) { next(error); }
});

// Export Excel / PDF
router.get('/ujian/:id/export', async (req, res, next) => {
  try {
    const ujian = await prisma.ujian.findUnique({
      where: { id: req.params.id },
      include: { kelas: { include: { kelas: true } } }
    });
    if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    const format = req.query.format || 'xlsx';
    const kelasIds = ujian.kelas.map(k => k.kelasId);
    const kelasNama = ujian.kelas.map(k => (k as any).kelas?.nama).filter(Boolean).join(', ');

    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: {
        sesiUjian: { where: { ujianId: req.params.id }, include: { pelanggaran: true } },
        kelas: true
      },
      orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }]
    });

    const selesaiList = siswaList.filter(s => {
      const st = s.sesiUjian[0]?.status;
      return (st === 'SELESAI' || st === 'AUTO_SUBMIT') && s.sesiUjian[0]?.nilaiAkhir !== null;
    });
    const nilaiArr = selesaiList.map(s => s.sesiUjian[0].nilaiAkhir as number);
    const rataRata = nilaiArr.length ? Math.round(nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length) : 0;
    const tertinggi = nilaiArr.length ? Math.max(...nilaiArr) : 0;
    const terendah = nilaiArr.length ? Math.min(...nilaiArr) : 0;

    const statusLabel = (s: any) => {
      if (!s) return 'Belum Mulai';
      if (s.status === 'SELESAI') return s.submitReason === 'timeout' ? 'Waktu Habis' : 'Selesai';
      if (s.status === 'AUTO_SUBMIT') return 'Auto-Submit';
      if (s.status === 'SEDANG_BERLANGSUNG') return 'Berlangsung';
      return 'Belum Mulai';
    };

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Hasil Ujian');

      ws.columns = [{ width: 5 }, { width: 14 }, { width: 30 }, { width: 14 }, { width: 10 }, { width: 16 }, { width: 13 }];

      ws.mergeCells('A1:G1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `REKAP NILAI UJIAN`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      ws.addRow([]);
      ws.addRow(['Judul Ujian', ujian.judul]);
      ws.addRow(['Mata Pelajaran', ujian.mataPelajaran]);
      ws.addRow(['Kelas', kelasNama]);
      ws.addRow(['Tanggal', new Date(ujian.tanggalMulai!).toLocaleDateString('id-ID')]);
      ws.addRow(['Durasi', `${ujian.durasi} menit`]);
      ws.addRow([]);

      const hRow = ws.addRow(['No', 'NIS', 'Nama Siswa', 'Kelas', 'Nilai', 'Status', 'Pelanggaran']);
      hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      hRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        cell.alignment = { horizontal: 'center' };
      });

      siswaList.forEach((s, idx) => {
        const sesi = s.sesiUjian[0];
        const row = ws.addRow([
          idx + 1, s.nis, s.nama, s.kelas?.nama ?? '-',
          sesi?.nilaiAkhir ?? '-', statusLabel(sesi), sesi?.pelanggaran?.length ?? 0
        ]);
        const nilai = sesi?.nilaiAkhir;
        if (nilai !== null && nilai !== undefined) {
          const scoreCell = row.getCell(5);
          scoreCell.font = { bold: true, color: { argb: nilai >= 75 ? 'FF16A34A' : nilai >= 60 ? 'FFCA8A04' : 'FFDC2626' } };
        }
      });

      ws.addRow([]);
      ws.addRow(['STATISTIK']);
      ws.addRow(['Peserta Selesai', selesaiList.length]);
      ws.addRow(['Rata-rata', rataRata]);
      ws.addRow(['Tertinggi', tertinggi]);
      ws.addRow(['Terendah', terendah]);

      const buf = await wb.xlsx.writeBuffer();
      const filename = `nilai-${ujian.judul.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buf));
      return;
    }

    if (format === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 45 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        const filename = `nilai-${ujian.judul.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buf);
      });

      // Header
      doc.rect(45, 40, 505, 70).fill('#1D4ED8');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('REKAP NILAI UJIAN', 45, 52, { width: 505, align: 'center' });
      doc.fontSize(10).font('Helvetica').text(ujian.judul, 45, 74, { width: 505, align: 'center' });
      doc.fillColor('#000000');
      doc.y = 125;

      // Info
      doc.fontSize(9).font('Helvetica');
      const infoLeft = [
        ['Mata Pelajaran', ujian.mataPelajaran],
        ['Kelas', kelasNama || '-'],
      ];
      const infoRight = [
        ['Tanggal', new Date(ujian.tanggalMulai!).toLocaleDateString('id-ID')],
        ['Durasi', `${ujian.durasi} menit`],
      ];
      let iy = doc.y;
      infoLeft.forEach(([k, v], i) => {
        doc.font('Helvetica-Bold').text(k, 45, iy + i * 16, { continued: true });
        doc.font('Helvetica').text(`: ${v}`);
      });
      infoRight.forEach(([k, v], i) => {
        doc.font('Helvetica-Bold').text(k, 320, iy + i * 16, { continued: true });
        doc.font('Helvetica').text(`: ${v}`);
      });
      doc.y = iy + infoLeft.length * 16 + 12;

      // Table header
      const colX = [45, 75, 120, 300, 370, 420, 490];
      const colW = [28, 44, 178, 68, 48, 68, 55];
      const headers2 = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Nilai', 'Status', 'Pelanggar.'];
      const th = doc.y;
      doc.rect(45, th, 510, 16).fill('#E2E8F0');
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
      headers2.forEach((h, i) => doc.text(h, colX[i], th + 4, { width: colW[i], align: i >= 4 ? 'center' : 'left' }));
      doc.fillColor('#000000').font('Helvetica').fontSize(8);

      let y2 = th + 18;
      siswaList.forEach((s, idx) => {
        if (y2 > 740) {
          doc.addPage();
          y2 = 45;
          doc.rect(45, y2, 510, 16).fill('#E2E8F0');
          doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8);
          headers2.forEach((h, i) => doc.text(h, colX[i], y2 + 4, { width: colW[i], align: i >= 4 ? 'center' : 'left' }));
          doc.fillColor('#000000').font('Helvetica').fontSize(8);
          y2 += 18;
        }
        if (idx % 2 === 0) doc.rect(45, y2, 510, 14).fill('#F8FAFC');
        const sesi = s.sesiUjian[0];
        doc.fillColor('#000000');
        doc.text(String(idx + 1), colX[0], y2 + 3, { width: colW[0], align: 'center' });
        doc.text(s.nis || '-', colX[1], y2 + 3, { width: colW[1] });
        doc.text(s.nama.slice(0, 30), colX[2], y2 + 3, { width: colW[2] });
        doc.text(s.kelas?.nama ?? '-', colX[3], y2 + 3, { width: colW[3] });
        const nilaiStr = sesi?.nilaiAkhir != null ? String(sesi.nilaiAkhir) : '-';
        const n = sesi?.nilaiAkhir;
        doc.fillColor(n != null ? (n >= 75 ? '#16A34A' : n >= 60 ? '#CA8A04' : '#DC2626') : '#64748B');
        doc.font('Helvetica-Bold').text(nilaiStr, colX[4], y2 + 3, { width: colW[4], align: 'center' });
        doc.fillColor('#000000').font('Helvetica');
        doc.text(statusLabel(sesi), colX[5], y2 + 3, { width: colW[5], align: 'center' });
        doc.text(String(sesi?.pelanggaran?.length ?? 0), colX[6], y2 + 3, { width: colW[6], align: 'center' });
        y2 += 14;
      });

      // Statistik
      y2 += 16;
      if (y2 > 700) { doc.addPage(); y2 = 45; }
      doc.rect(45, y2, 200, 16).fill('#1D4ED8');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('STATISTIK', 50, y2 + 4);
      y2 += 18;
      const stats2 = [
        ['Peserta Selesai', `${selesaiList.length} siswa`],
        ['Rata-rata Kelas', String(rataRata)],
        ['Nilai Tertinggi', String(tertinggi)],
        ['Nilai Terendah', String(terendah)],
      ];
      doc.fillColor('#000000').font('Helvetica').fontSize(9);
      stats2.forEach(([k, v]) => {
        doc.font('Helvetica-Bold').text(k, 50, y2, { continued: true });
        doc.font('Helvetica').text(` : ${v}`);
        y2 += 14;
      });

      // Tanda tangan placeholder
      if (y2 < 680) {
        y2 = Math.max(y2 + 20, 660);
        doc.fontSize(9).font('Helvetica').text('Mengetahui,', 380, y2);
        doc.text('Guru Mata Pelajaran', 380, y2 + 12);
        doc.moveTo(380, y2 + 60).lineTo(510, y2 + 60).stroke('#94A3B8');
        doc.text('(___________________)', 380, y2 + 64);
      }

      doc.end();
      return;
    }

    res.status(400).json({ error: 'Format tidak didukung' });
  } catch(error) { next(error); }
});

// PRESENSI
router.post('/presensi', async (req, res, next) => {
  try {
    const guru = await prisma.guru.findUnique({ where: { userId: (req.user as any).userId } });
    const { kelasId, tanggal, presensi } = req.body;
    
    // Batch insert/upsert
    const tgl = new Date(tanggal);
    tgl.setHours(0,0,0,0);

    const ops = presensi.map((p: any) => {
      // Kita pakai prisma.presensi.upsert jika mungkin disupport oleh provider (di SQLite unique constraint [siswaId, tanggal])
      // Tapi untuk aman, bisa bikin array lalu insert, dengan penghapusan sebelumnya
      return p;
    });

    // Menghindari duplikat per hari
    await prisma.presensi.deleteMany({
      where: {
        kelasId,
        tanggal: tgl
      }
    });

    const result = await prisma.presensi.createMany({
      data: presensi.map((p: any) => ({
        siswaId: p.siswaId,
        kelasId,
        guruId: guru!.id,
        tanggal: tgl,
        status: p.status,
        keterangan: p.keterangan || null
      }))
    });

    res.json({ success: true, count: result.count });
  } catch(error) { next(error); }
});

router.get('/presensi', async (req, res, next) => {
  try {
    const { kelasId, tanggal } = req.query;
    if (!kelasId || !tanggal) return res.status(400).json({ error: 'kelasId dan tanggal wajib diisi' });

    const tgl = new Date(String(tanggal));
    tgl.setHours(0,0,0,0);

    const records = await prisma.presensi.findMany({
      where: { kelasId: String(kelasId), tanggal: tgl },
      include: { siswa: true }
    });
    
    res.json(records);
  } catch(error) { next(error); }
});

router.get('/presensi/rekap', async (req, res, next) => {
  try {
    const { kelasId, bulan, tahun } = req.query;
    if (!kelasId || !bulan || !tahun) return res.status(400).json({ error: 'kelasId, bulan, tahun wajib' });

    const startObj = new Date(Number(tahun), Number(bulan) - 1, 1);
    const endObj = new Date(Number(tahun), Number(bulan), 1); // exclusive upper bound

    const records = await prisma.presensi.findMany({
      where: {
        kelasId: String(kelasId),
        tanggal: { gte: startObj, lt: endObj }
      },
      include: { siswa: { select: { id: true, nama: true, nis: true } } }
    });

    // Agregasi per siswa
    const map = new Map<string, { siswaId: string; nama: string; nis: string; hadir: number; izin: number; sakit: number; alpha: number }>();
    for (const r of records) {
      if (!map.has(r.siswaId)) {
        map.set(r.siswaId, { siswaId: r.siswaId, nama: r.siswa.nama, nis: r.siswa.nis, hadir: 0, izin: 0, sakit: 0, alpha: 0 });
      }
      const entry = map.get(r.siswaId)!;
      if (r.status === 'HADIR') entry.hadir++;
      else if (r.status === 'IZIN') entry.izin++;
      else if (r.status === 'SAKIT') entry.sakit++;
      else if (r.status === 'ALPHA') entry.alpha++;
    }

    const result = Array.from(map.values()).map(s => {
      const total = s.hadir + s.izin + s.sakit + s.alpha;
      const persentase = total > 0 ? Math.round((s.hadir / total) * 100) : 0;
      return { ...s, total, persentase };
    }).sort((a, b) => a.nama.localeCompare(b.nama));

    res.json(result);
  } catch(error) { next(error); }
});

router.get('/presensi/export', async (req, res, next) => {
  try {
    const { kelasId, bulan, tahun } = req.query;
    if (!kelasId || !bulan || !tahun) return res.status(400).json({ error: 'kelasId, bulan, tahun wajib' });

    const startObj = new Date(Number(tahun), Number(bulan) - 1, 1);
    const endObj = new Date(Number(tahun), Number(bulan), 1);

    const [records, kelas] = await Promise.all([
      prisma.presensi.findMany({
        where: { kelasId: String(kelasId), tanggal: { gte: startObj, lt: endObj } },
        include: { siswa: { select: { id: true, nama: true, nis: true } } }
      }),
      prisma.kelas.findUnique({ where: { id: String(kelasId) }, select: { nama: true } })
    ]);

    // Agregasi
    const map = new Map<string, { nama: string; nis: string; hadir: number; izin: number; sakit: number; alpha: number }>();
    for (const r of records) {
      if (!map.has(r.siswaId)) map.set(r.siswaId, { nama: r.siswa.nama, nis: r.siswa.nis, hadir: 0, izin: 0, sakit: 0, alpha: 0 });
      const e = map.get(r.siswaId)!;
      if (r.status === 'HADIR') e.hadir++;
      else if (r.status === 'IZIN') e.izin++;
      else if (r.status === 'SAKIT') e.sakit++;
      else if (r.status === 'ALPHA') e.alpha++;
    }

    const namaBulan = new Date(Number(tahun), Number(bulan) - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap Presensi');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = `Rekap Presensi - ${kelas?.nama || ''} - ${namaBulan}`;
    sheet.getCell('A1').font = { bold: true, size: 13 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow([]);
    const headerRow = sheet.addRow(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', '% Kehadiran']);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });
    sheet.columns = [
      { width: 5 }, { width: 14 }, { width: 28 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 13 }
    ];

    let no = 1;
    for (const [, s] of map) {
      const total = s.hadir + s.izin + s.sakit + s.alpha;
      const pct = total > 0 ? Math.round((s.hadir / total) * 100) : 0;
      const row = sheet.addRow([no++, s.nis, s.nama, s.hadir, s.izin, s.sakit, s.alpha, total, `${pct}%`]);
      row.getCell(9).font = { color: { argb: pct >= 90 ? 'FF16A34A' : pct >= 75 ? 'FFCA8A04' : 'FFDC2626' }, bold: true };
    }

    const buf = await workbook.xlsx.writeBuffer();
    const filename = `Presensi_${kelas?.nama || kelasId}_${namaBulan.replace(' ', '_')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch(error) { next(error); }
});

export default router;
