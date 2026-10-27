import { defineConfig } from "@prisma/config";

// Prisma 7 Configuration File
// Centralise la configuration de la source de données pour Prisma CLI (db push, migrate)
// Supporte automatiquement le mode local SQLite et le mode production Turso Cloud.

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// Pour libSQL/Turso, l'URL de connexion standard avec token
const connectionUrl = tursoUrl
  ? `${tursoUrl}?authToken=${tursoToken ?? ""}`
  : "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: connectionUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
