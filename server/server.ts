import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { logger, errorHandler } from './middleware';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import guruRoutes from './routes/guru';
import siswaRoutes from './routes/siswa';
import publicRoutes from './routes/public';

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`✅ Backend siap di http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
});
