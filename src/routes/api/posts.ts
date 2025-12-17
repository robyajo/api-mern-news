import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  listMine,
  create,
  update,
  remove,
} from "../../controllers/newsController";

export const postsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Posts management (authenticated)
 */

/**
 * @swagger
 * /api/posts/mine:
 *   get:
 *     summary: Get my posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's posts
 *       401:
 *         description: Unauthorized
 */
postsRouter.get("/mine", requireAuth, listMine);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create post
 *     tags: [Posts]
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
postsRouter.post("/", requireAuth, create);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update post
 *     tags: [Posts]
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
postsRouter.put("/:id", requireAuth, update);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
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
postsRouter.delete("/:id", requireAuth, remove);

