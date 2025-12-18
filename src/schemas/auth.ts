import { z } from "zod"

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(4, "Password minimal 4 karakter"),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(4, "Password minimal 4 karakter"),
})

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token wajib diisi" })
    .min(1, "Refresh token wajib diisi"),
})

