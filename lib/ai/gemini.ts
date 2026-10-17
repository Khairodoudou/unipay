import { GoogleGenAI } from "@google/genai";

// Ensure this module is never imported on client side
if (typeof window !== "undefined") {
  throw new Error("Ce module est exclusivement réservé à une exécution côté serveur.");
}

/**
 * Récupère le client GoogleGenAI initialisé de façon sécurisée depuis le serveur.
 * La clé API provient strictement de la variable d'environnement GEMINI_API_KEY.
 * Ne JAMAIS logger, exporter ou exposer cette clé.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-gemini-api-key") {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED: Clé API Gemini non configurée dans .env");
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Modèles Gemini vérifiés et supportés par l'API (octobre 2026).
 * Ordre de priorité : meilleur → fallback.
 *
 * Notes de vérification (test réel via @google/genai v2.27.0) :
 * - gemini-3.8-flash      ✅ Supporté (peut être saturé lors des pics)
 * - gemini-3.5-flash      ✅ Supporté (retourne 503 temporaire lors des pics)
 * - gemini-3.5-flash-lite ✅ Supporté (plus léger, moins saturé)
 * - gemini-flash-latest   ✅ Supporté (alias vers dernière version stable)
 * - gemini-2.0-flash      ❌ Désactivé définitivement (404)
 * - gemini-1.5-*          ❌ Hors service (404)
 *
 * En cas d'échec de tous les modèles, le moteur de fallback déterministe
 * prend le relais pour garantir la disponibilité continue du système d'audit.
 */
export const PREFERRED_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
] as const;

/**
 * Timeout en ms pour chaque appel API Gemini.
 * Augmenté à 12s pour absorber les pics de charge temporaires (503/timeout).
 * Le fallback déterministe est activé si tous les modèles échouent.
 */
export const GEMINI_REQUEST_TIMEOUT_MS = 12_000;

export type SupportedGeminiModel = (typeof PREFERRED_GEMINI_MODELS)[number];
