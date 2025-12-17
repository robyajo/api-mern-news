import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { list, getById, create, update, remove } from '../controllers/categoryController'

export const categoriesRouter = Router()

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Categories management
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get active categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
categoriesRouter.get('/', list)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category detail
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category detail
 *       404:
 *         description: Not found
 */
categoriesRouter.get('/:id', getById)

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Created
 *       401:
 *         description: Unauthorized
 */
categoriesRouter.post('/', requireAuth, create)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
categoriesRouter.put('/:id', requireAuth, update)

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
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
categoriesRouter.delete('/:id', requireAuth, remove)
