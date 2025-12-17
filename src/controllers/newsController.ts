import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'
import { notifyUser } from '../realtime'
import { getCache, setCache, delCache } from '../redis'
import { sendSuccess, sendError } from '../response'

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  published: z.boolean().optional(),
  category_name: z.string().optional()
})

// Helper to handle BigInt serialization
const serializeBigInt = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, v) => 
    typeof v === 'bigint' ? v.toString() : v
  ))
}

export async function listPublic(_req: Request, res: Response) {
  const cacheKey = 'news:public'
  const cached = await getCache(cacheKey)
  if (cached) {
    sendSuccess(res, 200, 'List public news', cached)
    return
  }
  const items = await prisma.posts.findMany({ 
    where: { status: 'published' }, 
    orderBy: { created_at: 'desc' },
    include: { users: { select: { name: true } } }
  })
  const payload = serializeBigInt(items)
  await setCache(cacheKey, payload, 60)
  sendSuccess(res, 200, 'List public news', payload)
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    sendError(res, 400, 'Invalid id')
    return
  }
  const item = await prisma.posts.findUnique({ where: { id: BigInt(id) } })
  if (!item) {
    sendError(res, 404, 'Not found')
    return
  }
  sendSuccess(res, 200, 'News detail', serializeBigInt(item))
}

export async function listMine(req: Request, res: Response) {
  const user = (req as any).user as { userId: string; role: string }
  const cacheKey = `news:mine:${user.userId}`
  const cached = await getCache(cacheKey)
  if (cached) {
    sendSuccess(res, 200, 'List my news', cached)
    return
  }
  const items = await prisma.posts.findMany({ 
    where: { user_id: BigInt(user.userId) }, 
    orderBy: { created_at: 'desc' } 
  })
  const payload = serializeBigInt(items)
  await setCache(cacheKey, payload, 60)
  sendSuccess(res, 200, 'List my news', payload)
}

async function getOrCreateCategory(userId: bigint, name: string = 'General') {
  let category = await prisma.categori_posts.findFirst({ where: { name } })
  if (!category) {
    category = await prisma.categori_posts.create({
      data: {
        uuid: uuidv4(),
        user_id: userId,
        name,
        slug: slugify(name, { lower: true }) + '-' + uuidv4().slice(0, 8),
        status: 'active'
      }
    })
  }
  return category.id
}

export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    sendError(res, 422, 'Validation error', errors)
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const userIdBig = BigInt(user.userId)
  
  const categoryId = await getOrCreateCategory(userIdBig, parsed.data.category_name)
  const slug = slugify(parsed.data.title, { lower: true }) + '-' + uuidv4().slice(0, 8)

  const item = await prisma.posts.create({
    data: { 
      uuid: uuidv4(),
      user_id: userIdBig,
      categori_id: categoryId,
      name: parsed.data.title,
      slug: slug,
      content: parsed.data.content,
      status: parsed.data.published ? 'published' : 'draft',
      created_at: new Date(),
      updated_at: new Date()
    }
  })
  await delCache('news:public')
  await delCache(`news:mine:${user.userId}`)
  notifyUser(user.userId, 'post:created', serializeBigInt(item))
  sendSuccess(res, 201, 'News created', serializeBigInt(item))
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional()
})

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    sendError(res, 400, 'Invalid id')
    return
  }
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    sendError(res, 422, 'Validation error', errors)
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const existing = await prisma.posts.findUnique({ where: { id: BigInt(id) } })
  if (!existing) {
    sendError(res, 404, 'Not found')
    return
  }
  
  const userIdBig = BigInt(user.userId)
  if (existing.user_id !== userIdBig && user.role !== 'admin') {
    sendError(res, 403, 'Forbidden')
    return
  }

  const data: any = {}
  if (parsed.data.title) {
    data.name = parsed.data.title
    data.slug = slugify(parsed.data.title, { lower: true }) + '-' + existing.uuid.slice(0, 8)
  }
  if (parsed.data.content) data.content = parsed.data.content
  if (parsed.data.published !== undefined) data.status = parsed.data.published ? 'published' : 'draft'
  data.updated_at = new Date()

  const item = await prisma.posts.update({ where: { id: BigInt(id) }, data })
  await delCache('news:public')
  await delCache(`news:mine:${user.userId}`)
  notifyUser(user.userId, 'post:updated', serializeBigInt(item))
  sendSuccess(res, 200, 'News updated', serializeBigInt(item))
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    sendError(res, 400, 'Invalid id')
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const existing = await prisma.posts.findUnique({ where: { id: BigInt(id) } })
  if (!existing) {
    sendError(res, 404, 'Not found')
    return
  }
  
  const userIdBig = BigInt(user.userId)
  if (existing.user_id !== userIdBig && user.role !== 'admin') {
    sendError(res, 403, 'Forbidden')
    return
  }
  await prisma.posts.delete({ where: { id: BigInt(id) } })
  await delCache('news:public')
  await delCache(`news:mine:${user.userId}`)
  notifyUser(user.userId, 'post:deleted', { id })
  sendSuccess(res, 200, 'News deleted', null)
}
