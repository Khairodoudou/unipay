/**
 * Script de synchronisation du schéma Prisma vers Turso Cloud (libSQL).
 * 
 * Exécute le DDL complet sur la base Turso via le protocole @libsql/client.
 * 
 * Usage :
 *   npx tsx scripts/push-to-turso.ts
 */

import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const tursoUrl =
  process.env.TURSO_DATABASE_URL ||
  "libsql://unipay-twiskou.aws-eu-west-1.turso.io";

const tursoToken =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMxMzc4MjEsImlkIjoiMDFhMTdmNTctNDAwMS03YzViLTg2YjktYjhkZWExMzA0OThlIiwia2lkIjoia3lpcUFXdzQ0TVMwYWhnbGt0aWdwOGZldEk2N3lhWmctRm11YV9tdnU5cyIsInJpZCI6IjQyNTRmOWY4LTI3YzEtNGVkZi04YzQ0LTQyNWMzMDE2NjdhNiJ9.Mrtn3W4kT_YOw3VVB8qOqA3tyaOS0w8O1l3Mx1Qfx1e9S3EybSpPx1HxA0B3DTOnFsJLYjMX4HtbaHyFb079CA";

async function main() {
  console.log("🚀 Connexion à Turso Cloud...");
  console.log(`   URL : ${tursoUrl}`);

  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  // Test de connectivité
  try {
    const ping = await client.execute("SELECT 1 AS ok;");
    console.log("✅ Connexion à Turso réussie !");
  } catch (err: any) {
    console.error("❌ Impossible de se connecter à Turso :", err.message);
    process.exit(1);
  }

  // 1. Génération du DDL SQL complet depuis schema.prisma
  console.log("📄 Génération du script SQL DDL depuis le schéma Prisma...");
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );

  // 2. Application sur Turso
  console.log("⚙️  Application du schéma sur Turso Cloud...");
  try {
    await client.executeMultiple(sql);
    console.log("✅ Schéma créé avec succès sur Turso Cloud !");
  } catch (err: any) {
    console.error("❌ Erreur lors de l'application du schéma :", err.message);
    process.exit(1);
  }

  // 3. Vérification des tables créées
  const tables = await client.execute(
    "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%';"
  );
  console.log(`📊 ${tables.rows.length} tables créées sur Turso :`);
  tables.rows.forEach((row) => console.log(`   - ${row.name}`));

  console.log("\n🎉 Turso Cloud est maintenant 100% prêt pour la production Vercel !");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
