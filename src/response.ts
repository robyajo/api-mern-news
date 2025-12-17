import { Response } from "express"

type SuccessStatus = "success"
type ErrorStatus = "error"

type SuccessBody<T> = {
  status: SuccessStatus
  message: string
  data: T
}

type ErrorBody<T = unknown> = {
  status: ErrorStatus
  message: string
  errors?: T
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
) {
  const body: SuccessBody<T> = { status: "success", message, data }
  return res.status(statusCode).json(body)
}

export function sendError<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  errors?: T
) {
  const body: ErrorBody<T> = { status: "error", message }
  if (errors !== undefined) {
    body.errors = errors
  }
  return res.status(statusCode).json(body)
}

