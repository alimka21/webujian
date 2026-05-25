// server/lib/prisma.ts
// PRISMA NO-RUST MODE — query engine via driver adapter (no native binary).
// Workaround Hostinger CloudLinux shared yang block Rust engine syscall.
//
// Adapter parse koneksi dari DATABASE_URL → config object mariadb driver.
// Singleton pattern: cegah multiple PrismaClient instance saat dev hot-reload
// dan ensure 1 connection pool per worker production.

import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL || "";
  if (!raw) {
    throw new Error("DATABASE_URL belum di-set di environment");
  }
  // Parse mysql://user:pass@host:port/db?connection_limit=15&...
  const url = new URL(raw);

  const connectionLimit = Number(url.searchParams.get("connection_limit") || 10);
  const connectTimeoutMs =
    Number(url.searchParams.get("connect_timeout") || 10) * 1000;
  // pool_timeout (detik) di-reuse sebagai acquireTimeout — waktu tunggu
  // pool untuk dapat koneksi (idle atau baru). Default 30s supaya tahan
  // burst (mis. submit ujian di shared hosting yg slow handshake).
  const acquireTimeoutMs =
    Number(url.searchParams.get("pool_timeout") || 30) * 1000;

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),

    // Ukuran pool. Default diturunkan ke 10 — Hostinger shared MySQL
    // sering max_user_connections=25, jadi 10 aman walau ada beberapa
    // worker. Override via ?connection_limit=N di DATABASE_URL.
    connectionLimit,

    // Socket-level handshake ke MySQL (TLS + auth).
    connectTimeout: connectTimeoutMs,

    // Waktu tunggu pool untuk dapat koneksi. Kalau pool penuh ATAU lagi
    // bikin koneksi baru yg lambat, ini batas sabar. Naikkan dari 10s
    // default ke 30s — bursty hot-path (submit ujian, dashboard) tidak
    // langsung error pas koneksi sebelumnya lagi reset.
    acquireTimeout: acquireTimeoutMs,

    // Release koneksi idle setelah 60s — penting biar koneksi tidak
    // nempel terus di sisi MySQL (yg punya max_user_connections terbatas
    // di shared hosting). Default mariadb 30 menit terlalu lama.
    idleTimeout: 60,

    // Tidak pre-warm pool — biar fresh start tidak hold koneksi yg
    // sebenarnya tidak diperlukan. Pool akan create on-demand.
    minimumIdle: 0,

    // Skip COM_RESET_CONNECTION setelah release — kurangi round-trip.
    // Aman karena Prisma sudah handle session state per-query.
    resetAfterUse: false,
  }, {
    // Log error koneksi yg muncul di luar request (mis. server MySQL
    // restart). Membantu debug bila pool sering timeout.
    onConnectionError: (err) => {
      console.error("[prisma/mariadb] connection error:", err.message);
    },
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
