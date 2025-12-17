import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { notifyUser } from '../realtime'

const createSchema = z.object({
  postId: z.number(),
  content: z.string().min(1),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  media: z.string().optional()
})

const serializeBigInt = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ))
}

export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }
  const user = (req as any).user as { userId: string; role: string }
  const postIdBig = BigInt(parsed.data.postId)
  const post = await prisma.posts.findUnique({ where: { id: postIdBig } })
  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }
  const comment = await prisma.comments.create({
    data: {
      uuid: uuidv4(),
      user_id: BigInt(user.userId),
      post_id: postIdBig,
      content: parsed.data.content,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      media: parsed.data.media,
      created_at: new Date(),
      updated_at: new Date()
    }
  })
  // Notify post owner and commenter
  const ownerId = post.user_id.toString()
  notifyUser(ownerId, 'comment:created', serializeBigInt({ postId: post.id.toString(), comment }))
  notifyUser(user.userId, 'comment:created', serializeBigInt({ postId: post.id.toString(), comment }))
  res.status(201).json(serializeBigInt(comment))
}

