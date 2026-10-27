import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclure better-sqlite3 du bundle serverless (Vercel)
  // Ce module natif n'est utilisé qu'en développement local.
  // En production, le client Prisma utilise @libsql/client pour Turso Cloud.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
