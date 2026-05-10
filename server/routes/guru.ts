// server/routes/guru.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
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
        selesaiAt: sesi?.selesaiAt ?? null,
        pelanggaran: sesi?.pelanggaran || []
      }
    });
    
    res.json(result);
  } catch(error) { next(error); }
});

// EXPORT Logic
router.get('/ujian/:id/export', async (req, res, next) => {
  try {
    const ujian = await prisma.ujian.findUnique({
      where: { id: req.params.id },
      include: { kelas: true }
    });
    if (!ujian) return res.status(404).json({ error: "Ujian tidak ditemukan" });

    const format = req.query.format || 'xlsx';
    const kelasIds = ujian.kelas.map((k) => k.kelasId);

    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: { in: kelasIds } },
      include: {
        sesiUjian: { where: { ujianId: req.params.id }, include: { pelanggaran: true } },
        kelas: true
      },
      orderBy: [{ kelas: { nama: 'asc' } }, { nama: 'asc' }]
    });

    if (format === 'xlsx') {
       const ExcelJS = (await import('exceljs')).default;
       const wb = new ExcelJS.Workbook();
       const ws = wb.addWorksheet("Hasil Ujian");
     
       ws.mergeCells("A1:G1");
       ws.getCell("A1").value = `HASIL UJIAN: ${ujian.judul}`;
       ws.getCell("A1").font = { size: 14, bold: true };
       ws.getCell("A1").alignment = { horizontal: "center" };
     
       ws.getCell("A2").value = `Mata Pelajaran: ${ujian.mataPelajaran}`;
       ws.getCell("A3").value = `Tanggal: ${new Date(ujian.tanggalMulai!).toLocaleDateString("id-ID")}`;
       ws.getCell("A4").value = `Durasi: ${ujian.durasi} menit`;
     
       const headers = ["No", "NIS", "Nama Siswa", "Kelas", "Nilai", "Status", "Pelanggaran"];
       const headerRow = ws.getRow(6);
       headers.forEach((h, i) => {
         headerRow.getCell(i + 1).value = h;
         headerRow.getCell(i + 1).font = { bold: true };
         headerRow.getCell(i + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F1FB" } };
         headerRow.getCell(i + 1).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
       });
     
       siswaList.forEach((s, idx) => {
         const sesi = s.sesiUjian[0];
         const status = !sesi ? "Belum mulai" : sesi.status === "SELESAI" ? "Selesai" : sesi.status === "AUTO_SUBMIT" ? "Auto-submit" : "Berlangsung";
         ws.addRow([
           idx + 1, s.nis, s.nama, s.kelas?.nama,
           sesi?.nilaiAkhir ?? "—", status, sesi?.pelanggaran?.length ?? 0
         ]);
       });
       
       ws.columns = [ { width: 5 }, { width: 12 }, { width: 30 }, { width: 12 }, { width: 8 }, { width: 14 }, { width: 12 } ];
       
       const buffer = await wb.xlsx.writeBuffer();
       const filename = `nilai-${ujian.judul.replace(/\s+/g, "-").toLowerCase()}.xlsx`;
       
       res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
       res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
       res.send(Buffer.from(buffer));
       return;
    } 

    if (format === 'pdf') {
       const PDFDocument = (await import('pdfkit')).default;
       const chunks: Buffer[] = [];
       const doc = new PDFDocument({ size: "A4", margin: 40 });
       
       doc.on("data", (chunk: Buffer) => chunks.push(chunk));
       doc.on("end", () => {
         const pdfBuffer = Buffer.concat(chunks);
         const filename = `nilai-${ujian.judul.replace(/\s+/g, "-").toLowerCase()}.pdf`;
         res.setHeader("Content-Type", "application/pdf");
         res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
         res.send(pdfBuffer);
       });
     
       doc.fontSize(16).font("Helvetica-Bold").text("HASIL UJIAN", { align: "center" });
       doc.moveDown(0.3);
       doc.fontSize(13).font("Helvetica").text(ujian.judul, { align: "center" });
       doc.moveDown(0.5);
       doc.fontSize(10);
       doc.text(`Mata Pelajaran: ${ujian.mataPelajaran}`);
       doc.text(`Tanggal: ${new Date(ujian.tanggalMulai!).toLocaleDateString("id-ID")}`);
       doc.text(`Durasi: ${ujian.durasi} menit`);
       doc.moveDown(1);
       
       const tableTop = doc.y;
       const colX = [40, 70, 110, 280, 360, 410, 480];
       const headers = ["No", "NIS", "Nama", "Kelas", "Nilai", "Status", "WARN"];
       doc.font("Helvetica-Bold").fontSize(9);
       headers.forEach((h, i) => doc.text(h, colX[i], tableTop));
       doc.moveTo(40, tableTop + 14).lineTo(550, tableTop + 14).stroke();
     
       doc.font("Helvetica").fontSize(9);
       let y = tableTop + 20;
       siswaList.forEach((s, idx) => {
         if (y > 750) { doc.addPage(); y = 40; }
         const sesi = s.sesiUjian[0];
         const status = !sesi ? "Belum" : sesi.status === "SELESAI" ? "OK" : sesi.status === "AUTO_SUBMIT" ? "Auto" : "Live";
         
         doc.text(String(idx + 1), colX[0], y);
         doc.text(s.nis || '-', colX[1], y);
         doc.text(s.nama.slice(0, 28), colX[2], y);
         doc.text(s.kelas?.nama ?? '-', colX[3], y);
         doc.text(String(sesi?.nilaiAkhir ?? "—"), colX[4], y);
         doc.text(status, colX[5], y);
         doc.text(String(sesi?.pelanggaran?.length ?? 0), colX[6], y);
         y += 16;
       });
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
    
    const startObj = new Date(Number(tahun), Number(bulan) - 1, 1);
    const endObj = new Date(Number(tahun), Number(bulan), 0);

    const records = await prisma.presensi.findMany({
      where: { 
        kelasId: String(kelasId),
        tanggal: { gte: startObj, lte: endObj }
      },
      include: { siswa: true }
    });

    res.json(records);
  } catch(error) { next(error); }
});

// Mock export excel untuk presensi
router.get('/presensi/export', async (req, res, next) => {
  try {
    res.json({ success: true, message: "Use rekap API to generate XLSX in frontend or similar logic as exams."});
  } catch(error) { next(error); }
});

export default router;
