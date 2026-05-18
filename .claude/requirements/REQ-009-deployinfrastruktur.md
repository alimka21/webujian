# REQ-009 — Deploy & Infrastruktur
 
**Label:** `REQ-009`  
**Area:** Hostinger, MySQL, GitHub CI/CD  
**Status:** 🔴 Belum dieksekusi
 
---
 
## Target Infrastruktur
 
```
GitHub (source of truth)
  ↓ push ke main
Hostinger (auto-deploy)
  ├── Node.js App #1 → Frontend (Vite build)
  │   Domain: domain-anda.com
  │   Build: npm install && npm run build
  │   Output: dist/
  │
  ├── Node.js App #2 → Backend (Express)
  │   Domain: api.domain-anda.com
  │   Root: server/
  │   Build: npm install && npm run build
  │   Start: npm start
  │
  └── MySQL Database (internal localhost:3306)
      Akses: phpMyAdmin
```
 
## Migrasi Database
 
- Dev: SQLite (`file:./prisma/dev.db`)
- Production: MySQL → ubah schema.prisma `provider = "mysql"`
- Tambah `@db.Text` untuk field konten panjang
- Jalankan: `npx prisma migrate deploy` saat pertama deploy
## Environment Variables
 
**Frontend (.env):**
```
VITE_API_URL=https://api.domain-anda.com
```
 
**Backend (server/.env):**
```
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
JWT_SECRET=random_string_min_32_chars
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://domain-anda.com
```
 
## Checklist Deploy
 
- [ ] Migrasi schema SQLite → MySQL
- [ ] Push ke GitHub
- [ ] Deploy backend di Hostinger, set env vars
- [ ] Jalankan `prisma migrate deploy` + `prisma db seed`
- [ ] Deploy frontend di Hostinger, set VITE_API_URL
- [ ] Pointing domain/subdomain DNS
- [ ] Verifikasi SSL aktif
- [ ] Test login production
---
---