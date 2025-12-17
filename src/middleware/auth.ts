import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { sendError } from '../response'
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    sendError(res, 401, 'Unauthorized')
    return
  }
  const token = header.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    sendError(res, 500, 'Server misconfigured')
    return
  }
  try {
    const payload = jwt.verify(token, secret) as { userId: string; role: string }
    ;(req as any).user = payload
    next()
  } catch {
    sendError(res, 401, 'Invalid token')
  }
}

