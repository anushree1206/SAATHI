import { type NextFunction, type Request, type Response } from "express";
import { verifyJwt } from "../lib/jwt";
import { findUserById } from "../lib/mongo";

export type AuthRequest = Request & {
  user?: { id: string; email: string; name: string };
};

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = String(req.headers.authorization || "").trim();
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Authorization token is required" });
    return;
  }

  try {
    const payload = verifyJwt(token);
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) {
      throw new Error("Invalid token payload");
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.user = { id: userId, email: user.email, name: user.name };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired authorization token" });
  }
}
