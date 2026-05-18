import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";

// ── Load .env from multiple possible locations ───────
console.log("[startup] __dirname:", __dirname);
console.log("[startup] cwd:", process.cwd());
console.log("[startup] os.homedir():", os.homedir());
console.log("[startup] process.env.HOME:", process.env.HOME);

const envCandidates = [
  path.join(__dirname, "../.env"),
  path.join(__dirname, "../../.env"),
  path.join(__dirname, "../../server/.env"),
  path.join(os.homedir(), ".env"),
  path.join(process.cwd(), ".env"),
  "/home/u120188252/.env",
  "/home/u120188252/domains/mediumaquamarine-camel-941738.hostingersite.com/.env",
];
let envLoadedFrom: string | null = null;
for (const p of envCandidates) {
  const exists = fs.existsSync(p);
  console.log(`[startup] check ${p}: ${exists ? "EXISTS" : "no"}`);
  if (exists && !envLoadedFrom) {
    // override:true → .env selalu menang atas env var yang sudah di-set Hostinger panel
    dotenv.config({ path: p, override: true });
    envLoadedFrom = p;
  }
}
console.log("[startup] .env loaded from:", envLoadedFrom || "(none — using process.env from system)");

// Debug: tampilkan DATABASE_URL dengan password disensor supaya bisa diverifikasi tanpa bocor kredensial
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const sanitized = dbUrl.replace(/:([^:@\/]+)@/, ":***@");
  console.log(`[startup] DATABASE_URL preview: ${sanitized}`);
  console.log(`[startup] DATABASE_URL length: ${dbUrl.length} chars`);
  console.log(`[startup] DATABASE_URL starts with: "${dbUrl.slice(0, 8)}"`);
} else {
  console.log("[startup] DATABASE_URL: (NOT SET)");
}
console.log("[startup] NODE_ENV:", process.env.NODE_ENV);

import { logger, errorHandler } from './middleware';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import guruRoutes from './routes/guru';
import siswaRoutes from './routes/siswa';
import publicRoutes from './routes/public';

// ── Bootstrap DB in-process (no child process spawning) ──────────
// LiteSpeed FastCGI spawn beberapa worker; spawning `prisma db push` lewat
// execSync sering hit EAGAIN. Solusinya: pakai Prisma client langsung untuk
// cek tabel & eksekusi migration.sql kalau tabel belum ada.

async function tablesExist(prisma: any): Promise<boolean> {
  try {
    await prisma.user.count();
    return true;
  } catch (err: any) {
    // P2021 = table doesn't exist; error message biasanya ada "does not exist"
    if (err?.code === "P2021" || /does not exist/i.test(err?.message ?? "")) {
      return false;
    }
    // Error lain (koneksi gagal, auth gagal, dll) — lempar ke caller
    throw err;
  }
}

function splitSqlStatements(sql: string): string[] {
  // Buang line comments & blok komentar, lalu split by ;
  const cleaned = sql
    .replace(/\/\*[\s\S]*?\*\//g, "")        // /* ... */
    .replace(/^\s*--.*$/gm, "");              // -- line comment
  return cleaned
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runInitMigration(prisma: any): Promise<void> {
  // Lokasi migration.sql relatif ke server/dist (file ada di server/prisma/migrations/...)
  const migrationDir = path.join(__dirname, "../prisma/migrations");
  if (!fs.existsSync(migrationDir)) {
    throw new Error(`Migration dir tidak ditemukan: ${migrationDir}`);
  }
  const subdirs = fs.readdirSync(migrationDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (subdirs.length === 0) {
    throw new Error(`Tidak ada migration di ${migrationDir}`);
  }
  console.log(`[startup] Found ${subdirs.length} migration(s): ${subdirs.join(", ")}`);

  for (const sub of subdirs) {
    const sqlFile = path.join(migrationDir, sub, "migration.sql");
    if (!fs.existsSync(sqlFile)) {
      console.warn(`[startup]   Skip ${sub}: migration.sql tidak ada`);
      continue;
    }
    const sql = fs.readFileSync(sqlFile, "utf8");
    const stmts = splitSqlStatements(sql);
    console.log(`[startup]   Applying ${sub}: ${stmts.length} statement(s)`);
    for (let i = 0; i < stmts.length; i++) {
      try {
        await prisma.$executeRawUnsafe(stmts[i]);
      } catch (err: any) {
        // Idempotent: kalau tabel/index sudah ada, abaikan
        if (/already exists/i.test(err?.message ?? "")) {
          continue;
        }
        console.error(`[startup]   ❌ Statement #${i + 1} gagal:\n${stmts[i].slice(0, 200)}...`);
        throw err;
      }
    }
  }
  console.log("[startup] ✅ Schema sync complete (via raw SQL).");
}

async function bootstrapDatabase() {
  if (process.env.NODE_ENV !== "production") return;
  try {
    const { prisma } = await import("./lib/prisma");

    // Step 1: kalau tabel belum ada → apply migration.sql
    const ready = await tablesExist(prisma);
    if (!ready) {
      console.log("[startup] Tables missing — applying init migration...");
      await runInitMigration(prisma);
    }

    // Step 2: cek user count — kalau kosong, seed (terlepas dari step 1)
    // Idempotent: seed pakai upsert, aman dijalankan ulang.
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("[startup] Database empty, running seed (in-process)...");
      const { runSeed } = await import("./prisma/seed");
      await runSeed(prisma);
      console.log("[startup] ✅ Seed complete.");
    } else {
      console.log(`[startup] ✅ Database has ${userCount} users — seed skipped.`);
    }
  } catch (err: any) {
    console.error("[startup] ❌ Bootstrap failed:", err?.message ?? err);
    if (err?.stack) console.error(err.stack);
  }
}

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3001) : 3001;

// Flag: bootstrap belum selesai → request ke /api/* (selain /health) dapat 503
let bootstrapDone = false;

// ── CORS dinamis: dev + production ────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter((x): x is string => !!x);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin (Postman, curl) di development
    if (!origin && process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(logger);

// ── Health check (Hostinger butuh) ────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    bootstrapDone,
    timestamp: new Date().toISOString(),
  });
});

// ── Gate: blok /api/* sampai bootstrap selesai ────────
app.use("/api", (_req, res, next) => {
  if (bootstrapDone) return next();
  res.status(503).json({
    error: "Database sedang disiapkan, coba lagi sebentar",
    retry_after_seconds: 5,
  });
});

// ── Mount routes ──────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/siswa", siswaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);

// Global Error Handler
app.use(errorHandler);

// ── Error handler global ──────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Serve frontend (production only) ─────────────────
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../../dist");
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// LiteSpeed FastCGI punya startup timeout pendek. Listen DULU supaya tidak
// di-kill, lalu bootstrap jalan di background. Sementara bootstrap belum
// selesai, request DB-aware akan dapat 503 dari middleware di bawah.
app.listen(PORT, () => {
  console.log(`✅ Backend siap di http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);

  // Bootstrap async di background — TIDAK boleh block listen
  console.log("[startup] Starting database bootstrap in background...");
  bootstrapDatabase()
    .then(() => {
      bootstrapDone = true;
      console.log("[startup] ✅ Bootstrap completed.");
    })
    .catch((err) => {
      bootstrapDone = true; // tetap tandai selesai supaya tidak block selamanya
      console.error("[startup] ❌ Bootstrap rejected:", err?.message ?? err);
    });
});
