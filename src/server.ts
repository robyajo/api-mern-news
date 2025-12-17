import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { specs } from './swagger'
import { authRouter } from './routes/auth'
import { newsRouter } from './routes/news'
import { commentsRouter } from './routes/comments'
import { postsRouter } from './routes/posts'
import { categoriesRouter } from './routes/categories'
import { errorHandler } from './middleware/error'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))

const apiRouter = express.Router()
apiRouter.use('/auth', authRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/categories', categoriesRouter)
apiRouter.use('/comments', commentsRouter)
app.use('/api/v1', apiRouter)

app.use('/auth', authRouter)       // legacy
app.use('/news', newsRouter)       // legacy
app.use('/comments', commentsRouter) // legacy

app.use(errorHandler)
