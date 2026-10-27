import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// ── Dual-Mode Prisma Client (Prisma 7) ───────────────────────────────────────
// • Développement : SQLite local via @prisma/adapter-better-sqlite3 (prisma/dev.db)
// • Production    : Turso Cloud via @prisma/adapter-libsql (TURSO_DATABASE_URL)
//
// La sélection du driver est automatique :
// Si TURSO_DATABASE_URL est définie → Turso Cloud
// Sinon → SQLite local

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // ── Production / Turso Cloud ──────────────────────────────────────────
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });

    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // ── Développement / SQLite local ────────────────────────────────────────
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({
    url: dbPath,
  });

  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });
}

// ── Singleton pattern pour Next.js (Fast Refresh / Hot Reload) ────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
