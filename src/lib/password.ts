import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

/**
 * Password hashing with Node's built-in scrypt — a memory-hard KDF, no extra
 * dependency and no native build step. Every password gets its own random salt
 * so two people choosing the same password still hash differently, and a leaked
 * table cannot be attacked with a single rainbow table.
 *
 * scrypt is CPU/node-only; this module must never be imported into Edge code
 * (middleware). Session signing lives in `session.ts` and is Edge-safe.
 */

const scryptAsync = promisify(scrypt);

// 64-byte derived key, 16-byte salt. Defaults for scrypt cost (N=16384) are
// left as Node's own — a sensible balance for interactive logins.
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return { hash: derived.toString("hex"), salt };
}

/**
 * Constant-time verification. Returns false rather than throwing on malformed
 * stored values so a corrupt row can never be mistaken for a match.
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  let stored: Buffer;
  try {
    stored = Buffer.from(hash, "hex");
  } catch {
    return false;
  }
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(stored, derived);
}
