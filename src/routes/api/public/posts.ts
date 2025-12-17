import { Router } from "express";
import { listPublic, getBySlug } from "../../../controllers/newsController";

export const publicPostsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: PublicPosts
 *   description: Public posts endpoints
 */

/**
 * @swagger
 * /api/public/posts:
 *   get:
 *     summary: Get published posts (public)
 *     tags: [PublicPosts]
 *     responses:
 *       200:
 *         description: List of posts
 */
publicPostsRouter.get("/", listPublic);

/**
 * @swagger
 * /api/public/posts/{slug}:
 *   get:
 *     summary: Get post detail (public)
 *     tags: [PublicPosts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post detail
 *       404:
 *         description: Not found
 */
publicPostsRouter.get("/:slug", getBySlug);
