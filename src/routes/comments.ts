import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { create } from '../controllers/commentsController'

export const commentsRouter = Router()

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments management
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: integer
 *               content:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               media:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       404:
 *         description: Post not found
 */
commentsRouter.post('/', requireAuth, create)

