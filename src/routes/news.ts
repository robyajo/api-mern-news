import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { listPublic, listMine, create, update, remove } from '../controllers/newsController'

export const newsRouter = Router()

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News management
 */

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Get public news
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news
 */
newsRouter.get('/', listPublic)

/**
 * @swagger
 * /news/mine:
 *   get:
 *     summary: Get my news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's news
 *       401:
 *         description: Unauthorized
 */
newsRouter.get('/mine', requireAuth, listMine)

/**
 * @swagger
 * /news:
 *   post:
 *     summary: Create news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *               category_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       401:
 *         description: Unauthorized
 */
newsRouter.post('/', requireAuth, create)

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     summary: Update news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
newsRouter.put('/:id', requireAuth, update)

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     summary: Delete news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
newsRouter.delete('/:id', requireAuth, remove)
