import crypto from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string, salt?: string) {
  const saltBuffer = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, saltBuffer, ITERATIONS, KEY_LENGTH, DIGEST);
  return { salt: saltBuffer.toString("hex"), hash: derived.toString("hex") };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = hashPassword(password, salt).hash;
  const bufA = Buffer.from(candidate, "hex");
  const bufB = Buffer.from(hash, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
