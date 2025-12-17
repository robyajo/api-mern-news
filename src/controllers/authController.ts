import { Request, Response } from 'express'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8)
})

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
  const { email, name, password } = parsed.data
  const existing = await prisma.users.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already used' })
    return
  }
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.users.create({
    data: { 
      email, 
      name, 
      password: hash, 
      role: 'user',
      uuid: uuidv4()
    }
  })
  res.json({ id: user.id.toString(), email: user.email, name: user.name, role: user.role })
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
  const { email, password } = parsed.data
  const user = await prisma.users.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }
  const token = jwt.sign({ userId: user.id.toString(), role: user.role }, secret, { expiresIn: '7d' })
  res.json({ token })
}

