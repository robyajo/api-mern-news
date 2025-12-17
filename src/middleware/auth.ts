import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = header.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }
  try {
    const payload = jwt.verify(token, secret) as { userId: string; role: string }
    ;(req as any).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

