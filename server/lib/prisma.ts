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
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    // Pool size dari query string connection_limit (default 15)
    connectionLimit: Number(url.searchParams.get("connection_limit") || 15),
    // Timeout dari connect_timeout query string (default 10s)
    connectTimeout: Number(url.searchParams.get("connect_timeout") || 10) * 1000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
