import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import { execSync } from "child_process";

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
    dotenv.config({ path: p });
    envLoadedFrom = p;
  }
}
console.log("[startup] .env loaded from:", envLoadedFrom || "(none — using process.env from system)");
console.log("[startup] DATABASE_URL set?", !!process.env.DATABASE_URL);
console.log("[startup] NODE_ENV:", process.env.NODE_ENV);

import { logger, errorHandler } from './middleware';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import guruRoutes from './routes/guru';
import siswaRoutes from './routes/siswa';
import publicRoutes from './routes/public';

// ── Auto-run migrations + seed in production ─────────
function resolvePrismaCli(): string | null {
  // Cari prisma/build/index.js via require.resolve (lebih reliable daripada hardcode path)
  try {
    const pkgJsonPath = require.resolve("prisma/package.json");
    const cliPath = path.join(path.dirname(pkgJsonPath), "build/index.js");
    if (fs.existsSync(cliPath)) return cliPath;
  } catch {}
  // Fallback: cek beberapa lokasi umum
  const candidates = [
    path.resolve(__dirname, "../../node_modules/prisma/build/index.js"),
    path.resolve(__dirname, "../node_modules/prisma/build/index.js"),
    path.resolve(process.cwd(), "node_modules/prisma/build/index.js"),
    path.resolve(process.cwd(), "server/node_modules/prisma/build/index.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function runCaptured(cmd: string, label: string): boolean {
  console.log(`[startup] $ ${cmd}`);
  try {
    const out = execSync(cmd, { env: process.env, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    if (out) console.log(`[startup] ${label} stdout:\n${out}`);
    return true;
  } catch (err: any) {
    console.error(`[startup] ${label} FAILED — exit code: ${err.status}`);
    if (err.stdout) console.error(`[startup] ${label} stdout:\n${err.stdout.toString()}`);
    if (err.stderr) console.error(`[startup] ${label} stderr:\n${err.stderr.toString()}`);
    if (err.message) console.error(`[startup] ${label} message: ${err.message}`);
    return false;
  }
}

async function bootstrapDatabase() {
  if (process.env.NODE_ENV !== "production") return;
  try {
    const prismaCli = resolvePrismaCli();
    if (!prismaCli) {
      console.error("[startup] ❌ Prisma CLI not found — bootstrap aborted.");
      console.error("[startup]    Pastikan `prisma` ter-install di node_modules root atau server/");
      return;
    }
    console.log(`[startup] Prisma CLI: ${prismaCli}`);

    const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
    const seedScript = path.join(__dirname, "prisma/seed.js");
    console.log(`[startup] Schema:     ${schemaPath} (exists: ${fs.existsSync(schemaPath)})`);
    console.log(`[startup] Seed:       ${seedScript} (exists: ${fs.existsSync(seedScript)})`);

    // chmod engine binaries (silent if fails)
    const enginesDir = path.join(path.dirname(prismaCli), "../../@prisma/engines");
    try { execSync(`chmod +x ${enginesDir}/* 2>/dev/null || true`); } catch {}

    console.log("[startup] Running prisma db push (sync schema -> DB)...");
    const pushOk = runCaptured(
      `node "${prismaCli}" db push --schema="${schemaPath}" --accept-data-loss --skip-generate`,
      "db push"
    );
    if (!pushOk) {
      console.error("[startup] ❌ Schema sync gagal — login tidak akan jalan sampai ini di-fix.");
      return;
    }
    console.log("[startup] ✅ Schema sync complete.");

    const { prisma } = await import("./lib/prisma");
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("[startup] Database empty, running seed...");
      if (fs.existsSync(seedScript)) {
        runCaptured(`node "${seedScript}"`, "seed");
      } else {
        console.error(`[startup] ❌ Seed script tidak ada di ${seedScript}`);
      }
    } else {
      console.log(`[startup] Database has ${userCount} users, skipping seed.`);
    }
  } catch (err) {
    console.error("[startup] Bootstrap unexpected error:", err);
  }
}

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3001) : 3001;

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
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

bootstrapDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend siap di http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
  });
});
