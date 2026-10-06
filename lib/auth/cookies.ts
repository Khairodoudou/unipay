import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "uni_pay_session";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/**
 * Configure et écrit le cookie de session sécurisé HttpOnly.
 */
export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SEVEN_DAYS_SECONDS,
  });
}

/**
 * Lit la valeur du cookie de session actuel.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value;
}

/**
 * Supprime le cookie de session.
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
