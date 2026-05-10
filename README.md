# Sistem Informasi Sekolah

Aplikasi full-stack komprehensif untuk sekolah, yang mencakup manajemen e-learning (Computer Based Test), tracer study alumni, informasi publik (CMS), dan panel admin untuk Guru serta Siswa.

## Teknologi
- Frontend: React 19, Tailwind CSS, Vite
- Backend: Node.js, Express, TypeScript (Vite Middleware untuk dev)
- Database: SQLite, Prisma ORM
- State Management: Zustand

## Instalasi
1. Clone repositori ini.
2. Jalankan \`npm install\`
3. Buat file \`.env\` (gunakan \`.env.example\` sebagai referensi) dan atur variabelnya:
    \`\`\`bash
    DATABASE_URL="file:./dev.db"
    JWT_SECRET="rahasia_sekolah_123"
    PORT=3000
    \`\`\`
4. Sinkronisasikan database dan jalankan seeding awal.

## Cara Menjalankan Dev
Aplikasi ini sudah dipersiapkan menggunakan combined server untuk environment dev dan production. Cukup gunakan:
\`\`\`bash
npm run dev
\`\`\`
*(Dalam package.json disediakan juga support jika ingin dipisah menggunakan concurrently, silakan dimodifikasi jika diperlukan.*

## Cara Seed Database
Pastikan schema database menggunakan SQLite, lalu jalankan:
\`\`\`bash
npm run db:migrate
npm run db:seed
\`\`\`
Perintah seed akan menghapus dan membuat akun demo berikut:

### Akun Demo
- **Super Admin**: \`admin@sekolah.sch.id\` | Password: \`admin123\`
- **Guru**: \`budi@sekolah.sch.id\` | Password: \`guru123\`
- **Siswa**: Login menggunakan **NIS** (Contoh: \`20250001\`) | Password: \`siswa123\`

## Struktur Folder Utama
- \`/applet/server\` - API backend menggunakan Express.js
- \`/prisma\` - Schema PRISMA dan file \`seed.ts\`
- \`/src/components\` - Komponen UI React (global dan modular)
- \`/src/lib\` - Utility umum Frontend (\`api.ts\` & \`format.ts\`)
- \`/src/pages\` - Halaman aplikasi
- \`/src/store\` - Konfigurasi Zustand (auth dan state exam)

## Endpoint API Utama
- \`/api/auth/login\` - Endpoint autentikasi.
- \`/api/auth/me\` - Mendapatkan data sesi user saat ini.
- \`/api/exams/*\` - Modul Ujian. GET untuk fetch ujian, POST untuk submit.
- \`/api/admin/*\` - Pengelolaan master data dan users oleh Admin.
- \`/api/berita/*\` - API informasi berita publik dan CMS.

## Troubleshooting
Bila Anda menemukan error \`database disk image is malformed\`:
1. Hapus `/prisma/dev.db` dan `/prisma/dev.db-journal`
2. Jalankan instruksi seed di atas untuk membangun ulang DB.
