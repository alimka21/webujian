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

  // CloudLinux/Hostinger: hostname "localhost" kadang trigger driver mariadb
  // untuk coba Unix socket dulu (yg tidak ada di container Node.js).
  // Paksa TCP dengan rewrite ke "127.0.0.1".
  let host = url.hostname;
  if (host === "localhost") {
    host = "127.0.0.1";
    console.log("[prisma] host=localhost → di-rewrite ke 127.0.0.1 (paksa TCP)");
  }

  const port = url.port ? Number(url.port) : 3306;
  const user = decodeURIComponent(url.username);
  const database = url.pathname.slice(1);

  const connectionLimit = Number(url.searchParams.get("connection_limit") || 10);
  const connectTimeoutMs =
    Number(url.searchParams.get("connect_timeout") || 10) * 1000;
  const acquireTimeoutMs =
    Number(url.searchParams.get("pool_timeout") || 30) * 1000;

  // Log config (tanpa password) supaya gampang verifikasi di log production
  console.log(
    `[prisma] connect → mysql://${user}:***@${host}:${port}/${database} ` +
    `(pool=${connectionLimit}, acquire=${acquireTimeoutMs}ms, connect=${connectTimeoutMs}ms)`
  );

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password: decodeURIComponent(url.password),
    database,
    connectionLimit,
    connectTimeout: connectTimeoutMs,
    acquireTimeout: acquireTimeoutMs,
    idleTimeout: 60,
    minimumIdle: 0,
    resetAfterUse: false,
    // MySQL 8 caching_sha2_password fallback tanpa SSL — Hostinger sering
    // pakai MySQL 8 dengan auth plugin baru ini.
    allowPublicKeyRetrieval: true,
  } as any, {
    onConnectionError: (err) => {
      console.error("[prisma/mariadb] connection error:", err?.code, err?.message);
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

/**
 * Diagnostic — test koneksi raw lewat mysql2 (terpisah dari Prisma pool).
 * Dipakai saat startup untuk ungkap error sebenarnya yg di-swallow oleh
 * adapter mariadb (auth, host tidak reachable, dll).
 * Return null kalau sukses, error message kalau gagal.
 */
export async function diagnoseConnection(): Promise<string | null> {
  try {
    const raw = process.env.DATABASE_URL || "";
    if (!raw) return "DATABASE_URL kosong";
    const url = new URL(raw);
    const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;

    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection({
      host,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectTimeout: 10000,
    });
    await conn.query("SELECT 1");
    await conn.end();
    return null;
  } catch (err: any) {
    return `[${err?.code || "ERR"}] ${err?.message || String(err)}`;
  }
}
