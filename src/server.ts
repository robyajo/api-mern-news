import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { newsRouter } from './routes/news'
import { errorHandler } from './middleware/error'
export const app = express()
app.use(cors())
app.use(express.json())
app.use('/auth', authRouter)
app.use('/news', newsRouter)
app.use(errorHandler)

