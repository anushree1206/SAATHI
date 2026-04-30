import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const ALGORITHM = "HS256";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(value: string): Buffer {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(content: string): string {
  return base64UrlEncode(crypto.createHmac("sha256", SECRET).update(content).digest());
}

function parseExpires(expiresIn: string | number): number {
  if (typeof expiresIn === "number") return expiresIn;
  const match = /^([0-9]+)(s|m|h|d)?$/i.exec(expiresIn.trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return value;
  }
}

export function signJwt(payload: Record<string, unknown>, options?: { expiresIn?: string | number }) {
  const header = { alg: ALGORITHM, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body: Record<string, unknown> = {
    ...payload,
    iat: now,
  };

  if (options?.expiresIn) {
    body.exp = now + parseExpires(options.expiresIn);
  }

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header), "utf8"));
  const encodedBody = base64UrlEncode(Buffer.from(JSON.stringify(body), "utf8"));
  const signature = sign(`${encodedHeader}.${encodedBody}`);

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyJwt(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [encodedHeader, encodedBody, signature] = parts;
  const expected = sign(`${encodedHeader}.${encodedBody}`);

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length || !crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
    throw new Error("Invalid JWT signature");
  }

  const payloadJson = base64UrlDecode(encodedBody).toString("utf8");
  const payload = JSON.parse(payloadJson) as Record<string, unknown>;

  if (payload.exp && typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      throw new Error("JWT token expired");
    }
  }

  return payload;
}
