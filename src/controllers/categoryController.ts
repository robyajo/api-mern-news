import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

const serializeBigInt = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ))
}

export async function list(req: Request, res: Response) {
  const items = await prisma.categori_posts.findMany({
    where: { status: 'active' },
    orderBy: { created_at: 'desc' }
  })
  res.json(serializeBigInt(items))
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const item = await prisma.categori_posts.findUnique({ where: { id: BigInt(id) } })
  if (!item) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(serializeBigInt(item))
}

export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const slug = slugify(parsed.data.name, { lower: true })
  const item = await prisma.categori_posts.create({
    data: {
      uuid: uuidv4(),
      user_id: BigInt(user.userId),
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      status: parsed.data.status ?? 'active',
      created_at: new Date(),
      updated_at: new Date()
    }
  })
  res.status(201).json(serializeBigInt(item))
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const existing = await prisma.categori_posts.findUnique({ where: { id: BigInt(id) } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (existing.user_id.toString() !== user.userId && user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const data: any = {}
  if (parsed.data.name) {
    data.name = parsed.data.name
    data.slug = slugify(parsed.data.name, { lower: true })
  }
  if (parsed.data.description !== undefined) data.description = parsed.data.description
  if (parsed.data.status !== undefined) data.status = parsed.data.status
  data.updated_at = new Date()
  const item = await prisma.categori_posts.update({ where: { id: BigInt(id) }, data })
  res.json(serializeBigInt(item))
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const existing = await prisma.categori_posts.findUnique({ where: { id: BigInt(id) } })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (existing.user_id.toString() !== user.userId && user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await prisma.categori_posts.delete({ where: { id: BigInt(id) } })
  res.status(204).end()
}

