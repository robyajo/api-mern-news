import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess, sendError } from "../response";

const registerSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(4, "Password minimal 4 karakter"),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 422, "Validation error", errors);
    return;
  }
  const { email, name, password } = parsed.data;
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 409, "Email already used", {
      field: "email",
      message: "Email sudah terdaftar, silakan gunakan email lain",
    });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      email,
      name,
      password: hash,
      role: "user",
      uuid: uuidv4(),
    },
  });
  sendSuccess(res, 200, "Registrasi berhasil", {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(4, "Password minimal 4 karakter"),
});

const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token wajib diisi" })
    .min(1, "Refresh token wajib diisi"),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 422, "Validation error", errors);
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    sendError(res, 401, "Email not registered", {
      field: "email",
      message: "Email belum terdaftar, silakan registrasi terlebih dahulu",
    });
    return;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    sendError(res, 401, "Invalid credentials", {
      field: "password",
      message: "Password yang Anda masukkan salah",
    });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    sendError(res, 500, "Server misconfigured");
    return;
  }
  const accessExpiresInSeconds = 7 * 24 * 60 * 60;
  const accessExpiresAt = new Date(
    Date.now() + accessExpiresInSeconds * 1000
  ).toISOString();
  const token = jwt.sign(
    { userId: user.id.toString(), role: user.role },
    secret,
    { expiresIn: accessExpiresInSeconds }
  );
  const refreshExpiresInSeconds = 30 * 24 * 60 * 60;
  const refreshToken = jwt.sign(
    { userId: user.id.toString(), role: user.role, tokenType: "refresh" },
    secret,
    { expiresIn: refreshExpiresInSeconds }
  );
  sendSuccess(res, 200, "Login berhasil", {
    token,
    refreshToken,
    expiresIn: accessExpiresInSeconds,
    expiresAt: accessExpiresAt,
    name: user.name,
    role: user.role,
  });
}

export async function me(req: Request, res: Response) {
  const payload = (req as any).user as { userId: string; role: string };
  if (!payload || !payload.userId) {
    sendError(res, 401, "Unauthorized");
    return;
  }
  const user = await prisma.users.findUnique({
    where: { id: BigInt(payload.userId) },
  });
  if (!user) {
    sendError(res, 404, "User not found");
    return;
  }
  const { password, remember_token, ...rest } = user as any;
  sendSuccess(res, 200, "User profile", {
    ...rest,
    id: user.id.toString(),
  });
}

export async function logout(req: Request, res: Response) {
  sendSuccess(res, 200, "Logged out successfully", null);
}

export async function refreshToken(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 422, "Validation error", errors);
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    sendError(res, 500, "Server misconfigured");
    return;
  }
  try {
    const decoded = jwt.verify(parsed.data.refreshToken, secret) as {
      userId: string;
      role: string;
      tokenType?: string;
      iat: number;
      exp: number;
    };
    if (decoded.tokenType !== "refresh") {
      sendError(res, 401, "Invalid refresh token");
      return;
    }
    const user = await prisma.users.findUnique({
      where: { id: BigInt(decoded.userId) },
    });
    if (!user) {
      sendError(res, 401, "Invalid refresh token");
      return;
    }
    const accessExpiresInSeconds = 7 * 24 * 60 * 60;
    const accessExpiresAt = new Date(
      Date.now() + accessExpiresInSeconds * 1000
    ).toISOString();
    const token = jwt.sign(
      { userId: user.id.toString(), role: user.role },
      secret,
      { expiresIn: accessExpiresInSeconds }
    );
    sendSuccess(res, 200, "Token refreshed", {
      token,
      expiresIn: accessExpiresInSeconds,
      expiresAt: accessExpiresAt,
      name: user.name,
      role: user.role,
    });
  } catch {
    sendError(res, 401, "Invalid refresh token");
  }
}
