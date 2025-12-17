import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { listPublic, listMine, create, update, remove } from '../controllers/newsController'
export const newsRouter = Router()
newsRouter.get('/', listPublic)
newsRouter.get('/mine', requireAuth, listMine)
newsRouter.post('/', requireAuth, create)
newsRouter.put('/:id', requireAuth, update)
newsRouter.delete('/:id', requireAuth, remove)
