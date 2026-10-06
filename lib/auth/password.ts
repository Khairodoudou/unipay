import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hache un mot de passe en utilisant bcrypt avec 12 tours de salage.
 * Exécuté exclusivement côté serveur.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

/**
 * Vérifie un mot de passe en clair par rapport à son empreinte bcrypt.
 */
export async function verifyPassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Politique minimale de mot de passe UNI-PAY (au moins 8 caractères).
 */
export function validatePasswordPolicy(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    };
  }
  return { valid: true };
}
