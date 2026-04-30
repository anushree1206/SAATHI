import { Router } from "express";
import { z } from "zod";
import { createUser, findUserByEmail, findUserById } from "../lib/mongo";
import { hashPassword, verifyPassword } from "../lib/password";
import { signJwt } from "../lib/jwt";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

const AuthSignupBody = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const AuthLoginBody = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/signup", async (req, res) => {
  try {
    const parsed = AuthSignupBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid signup payload" });
      return;
    }

    const { name, email, password } = parsed.data;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: "A user with that email already exists" });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const userId = await createUser(name.trim(), email.trim(), hash, salt);

    const token = signJwt({ sub: userId.toHexString(), email: email.toLowerCase(), name: name.trim() }, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: userId.toHexString(),
        name: name.trim(),
        email: email.toLowerCase(),
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ error: "Failed to create user account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = AuthLoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid login payload" });
      return;
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signJwt({ sub: user._id.toHexString(), email: user.email, name: user.name }, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.user?.id ?? "",
      name: req.user?.name ?? "",
      email: req.user?.email ?? "",
    },
  });
});

export default router;
