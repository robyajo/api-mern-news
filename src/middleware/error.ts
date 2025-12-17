import { Request, Response, NextFunction } from 'express'
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const code = err.statusCode || 500
  const msg = err.message || 'Internal Server Error'
  res.status(code).json({ error: msg })
}

