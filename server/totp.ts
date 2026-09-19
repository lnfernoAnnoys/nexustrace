import { generateSecret, generateURI, verifySync } from "otplib";
import { TOTP_ISSUER } from "./config.ts";

export function newTotpSecret(): string {
  return generateSecret();
}

/** otpauth:// URL that authenticator apps (Google Authenticator, Authy, ...) read from the QR code. */
export function totpUrl(username: string, secret: string): string {
  return generateURI({ issuer: TOTP_ISSUER, label: username, secret });
}

/**
 * Checks a 6-digit code, allowing one 30s step of clock drift either way.
 * Returns the matched time step (store it as `lastStep` to block replays) or null.
 */
export function checkTotp(secret: string, token: string, lastStep: number): number | null {
  try {
    const result = verifySync({ secret, token, epochTolerance: 30, afterTimeStep: lastStep });
    return result.valid && "timeStep" in result ? result.timeStep : null;
  } catch {
    return null;
  }
}
