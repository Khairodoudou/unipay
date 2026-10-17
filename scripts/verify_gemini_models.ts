/**
 * Script de vérification des Model IDs Gemini réellement supportés.
 * Lance: npx tsx scripts/verify_gemini_models.ts
 */
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "fs";

// Charger .env manuellement
const envContent = dotenv.readFileSync(".env", "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  envVars[key] = val;
}

const apiKey = envVars["GEMINI_API_KEY"];
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY non trouvée dans .env");
  process.exit(1);
}

console.log("🔑 Clé API détectée (masquée):", apiKey.slice(0, 6) + "..." + apiKey.slice(-4));
console.log("📦 Version SDK: @google/genai installé\n");

const ai = new GoogleGenAI({ apiKey });

// Liste des model IDs candidats à tester
const CANDIDATE_MODELS = [
  // Série 3.x (nouvelles)
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  // Série 2.x
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-preview-05-20",
  // Série 1.5 (legacy)
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  // Génériques
  "gemini-pro",
];

const SIMPLE_PROMPT = "Reply with only the word: OK";

async function testModel(model: string): Promise<{ ok: boolean; error?: string; latency?: number }> {
  const start = Date.now();
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: SIMPLE_PROMPT,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT_5s")), 5000)
      ),
    ]);
    const latency = Date.now() - start;
    const text = (response as { text?: string }).text?.trim() || "(empty)";
    return { ok: true, latency };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 120) : String(err).slice(0, 120),
    };
  }
}

async function main() {
  console.log("🧪 Test des Model IDs Gemini en cours...\n");
  console.log("=".repeat(65));

  const working: string[] = [];
  const failed: Array<{ model: string; error: string }> = [];

  for (const model of CANDIDATE_MODELS) {
    process.stdout.write(`  Testing: ${model.padEnd(38)}`);
    const result = await testModel(model);
    if (result.ok) {
      console.log(`✅ OK (${result.latency}ms)`);
      working.push(model);
    } else {
      console.log(`❌ FAIL: ${result.error}`);
      failed.push({ model, error: result.error || "unknown" });
    }
    // Petite pause pour éviter le rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n" + "=".repeat(65));
  console.log(`\n✅ MODÈLES FONCTIONNELS (${working.length}):`);
  for (const m of working) {
    console.log(`   - "${m}"`);
  }

  if (working.length > 0) {
    console.log("\n📝 Mise à jour recommandée pour lib/ai/gemini.ts:");
    console.log(`   PREFERRED_GEMINI_MODELS = [`);
    for (const m of working.slice(0, 3)) {
      console.log(`     "${m}",`);
    }
    console.log(`   ]`);
  } else {
    console.log("\n⚠️  Aucun modèle ne répond. Vérifiez:");
    console.log("   1. La validité de la clé API GEMINI_API_KEY");
    console.log("   2. La connectivité réseau vers ai.googleapis.com");
    console.log("   3. Les quotas du compte Google AI Studio");
  }

  console.log("\n❌ MODÈLES EN ÉCHEC:");
  for (const { model, error } of failed) {
    console.log(`   - ${model}: ${error}`);
  }
}

main().catch((e) => {
  console.error("Erreur fatale:", e);
  process.exit(1);
});
