// prisma/seed.ts
// Jalankan: npx prisma db seed
// Pastikan package.json punya: "prisma": { "seed": "tsx prisma/seed.ts" }

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database...");

  // ── Hash password default ──────────────────────────────
  const passAdmin = await bcrypt.hash("admin123", 10);
  const passGuru  = await bcrypt.hash("guru123",  10);
  const passSiswa = await bcrypt.hash("siswa123", 10);

  // ── 1. Super Admin ─────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@sekolah.sch.id" },
    update: {},
    create: {
      email: "admin@sekolah.sch.id",
      password: passAdmin,
      role: "SUPER_ADMIN",
      admin: { create: { nama: "Administrator Sekolah" } },
    },
  });
  console.log("✓ Super Admin dibuat: admin@sekolah.sch.id / admin123");

  // ── 2. Guru-guru ───────────────────────────────────────
  const guru1 = await prisma.user.upsert({
    where: { email: "budi@sekolah.sch.id" },
    update: {},
    create: {
      email: "budi@sekolah.sch.id",
      password: passGuru,
      role: "GURU",
      guru: {
        create: {
          nip: "198501012010011001",
          nama: "Budi Santoso, S.Pd",
          mataPelajaran: "Matematika",
        },
      },
    },
    include: { guru: true },
  });

  const guru2 = await prisma.user.upsert({
    where: { email: "siti@sekolah.sch.id" },
    update: {},
    create: {
      email: "siti@sekolah.sch.id",
      password: passGuru,
      role: "GURU",
      guru: {
        create: {
          nip: "198703152011012002",
          nama: "Siti Aminah, S.Pd",
          mataPelajaran: "Bahasa Indonesia",
        },
      },
    },
    include: { guru: true },
  });

  console.log("✓ Guru dibuat: budi@... / guru123  &  siti@... / guru123");

  // ── 3. Kelas ───────────────────────────────────────────
  const kelas12IPA1 = await prisma.kelas.create({
    data: {
      nama: "XII IPA 1",
      tingkat: "XII",
      tahunAjaran: "2025/2026",
      guruId: guru1.guru!.id,
    },
  });

  const kelas12IPA2 = await prisma.kelas.create({
    data: {
      nama: "XII IPA 2",
      tingkat: "XII",
      tahunAjaran: "2025/2026",
      guruId: guru2.guru!.id,
    },
  });

  console.log("✓ 2 kelas dibuat (XII IPA 1 & XII IPA 2)");

  // ── 4. Siswa (5 siswa per kelas) ───────────────────────
  const siswaData = [
    { nis: "20250001", nama: "Agus Hermawan",  kelasId: kelas12IPA1.id },
    { nis: "20250002", nama: "Dewi Rahayu",    kelasId: kelas12IPA1.id },
    { nis: "20250003", nama: "Rizky Pratama",  kelasId: kelas12IPA1.id },
    { nis: "20250004", nama: "Siti Nurhaliza", kelasId: kelas12IPA1.id },
    { nis: "20250005", nama: "Ahmad Fauzi",    kelasId: kelas12IPA1.id },
    { nis: "20250006", nama: "Layla Andini",   kelasId: kelas12IPA2.id },
    { nis: "20250007", nama: "Bayu Saputra",   kelasId: kelas12IPA2.id },
    { nis: "20250008", nama: "Citra Lestari",  kelasId: kelas12IPA2.id },
  ];

  for (const s of siswaData) {
    await prisma.user.upsert({
      where: { email: `${s.nis}@siswa.sch.id` },
      update: {},
      create: {
        email: `${s.nis}@siswa.sch.id`,
        password: passSiswa,
        role: "SISWA",
        siswa: {
          create: {
            nis: s.nis,
            nama: s.nama,
            kelasId: s.kelasId,
          },
        },
      },
    });
  }
  console.log(`✓ ${siswaData.length} siswa dibuat (login dengan NIS, password: siswa123)`);

  // ── 5. Contoh ujian + soal ─────────────────────────────
  const ujianContoh = await prisma.ujian.create({
    data: {
      judul: "Latihan Matematika - Kalkulus",
      mataPelajaran: "Matematika",
      tipeUjian: "LATIHAN",
      durasi: 60,
      tanggalMulai: new Date(Date.now() + 1000 * 60 * 60),       // 1 jam dari sekarang
      tanggalSelesai: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 jam dari sekarang
      acak: false,
      guruId: guru1.guru!.id,
      kelas: { create: [{ kelasId: kelas12IPA1.id }] },
      soal: {
        create: [
          {
            nomor: 1,
            tipe: "PILIHAN_GANDA",
            teks: "Hasil dari turunan f(x) = 3x² + 2x - 5 adalah...",
            poin: 1,
            opsi: {
              create: [
                { teks: "6x + 2",     benar: true,  urutan: 1 },
                { teks: "3x + 2",     benar: false, urutan: 2 },
                { teks: "6x - 5",     benar: false, urutan: 3 },
                { teks: "x² + 2",     benar: false, urutan: 4 },
              ],
            },
          },
          {
            nomor: 2,
            tipe: "BENAR_SALAH",
            teks: "Integral dari 2x adalah x² + C",
            poin: 1,
            opsi: {
              create: [
                { teks: "Benar", benar: true,  urutan: 1 },
                { teks: "Salah", benar: false, urutan: 2 },
              ],
            },
          },
          {
            nomor: 3,
            tipe: "PG_KOMPLEKS",
            teks: "Manakah dari berikut yang merupakan fungsi naik pada interval (0, ∞)?",
            poin: 2,
            opsi: {
              create: [
                { teks: "f(x) = x²",     benar: true,  urutan: 1 },
                { teks: "f(x) = ln(x)",  benar: true,  urutan: 2 },
                { teks: "f(x) = 1/x",    benar: false, urutan: 3 },
                { teks: "f(x) = -x",     benar: false, urutan: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✓ Ujian contoh dibuat dengan 3 soal: "${ujianContoh.judul}"`);

  // ── 6. Contoh Berita & Alumni ─────────────────────────
  await prisma.berita.createMany({
    data: [
      {
        judul: "Selamat Datang Siswa Baru",
        slug: "selamat-datang-siswa-baru",
        konten: "Kami mengucapkan selamat datang kepada seluruh siswa baru...",
        ringkasan: "Penyambutan siswa baru",
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      {
        judul: "Prestasi Olimpiade Sains",
        slug: "prestasi-olimpiade-sains",
        konten: "Siswa sekolah kita berhasil meraih medali emas di ajang OSN...",
        ringkasan: "Prestasi OSN",
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    ]
  });
  console.log("✓ 2 Berita contoh dibuat");

  await prisma.alumni.createMany({
    data: [
      {
        nama: "Andi Saputra",
        nis: "20200001",
        tahunLulus: 2023,
        jurusan: "IPA",
        status: "KULIAH",
        instansi: "Universitas Indonesia"
      },
      {
        nama: "Rina Wijayanti",
        nis: "20200002",
        tahunLulus: 2023,
        jurusan: "IPA",
        status: "BEKERJA",
        instansi: "PT Telekomunikasi Indonesia",
        posisi: "Software Engineer"
      },
      {
        nama: "Deni Pratama",
        nis: "20200003",
        tahunLulus: 2023,
        jurusan: "IPS",
        status: "WIRAUSAHA",
        instansi: "Kedai Kopi Senja"
      }
    ]
  });
  console.log("✓ 3 Alumni contoh dibuat");

  console.log("\n🎉 Seeding selesai!");
  console.log("\n━━━━━━━━━━ AKUN DEMO ━━━━━━━━━━");
  console.log("Super Admin:  admin@sekolah.sch.id / admin123");
  console.log("Guru:         budi@sekolah.sch.id  / guru123");
  console.log("Siswa (NIS):  20250001 / siswa123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
