import { Router } from "express";
import { list, getBySlug } from "../../../controllers/categoryController";

export const publicCategoriesRouter = Router();

/**
 * @swagger
 * tags:
 *   name: PublicCategories
 *   description: Public categories endpoints
 */

/**
 * @swagger
 * /api/public/categories:
 *   get:
 *     summary: Get active categories (public)
 *     tags: [PublicCategories]
 *     responses:
 *       200:
 *         description: List of categories
 */
publicCategoriesRouter.get("/", list);

/**
 * @swagger
 * /api/public/categories/{slug}:
 *   get:
 *     summary: Get category detail (public)
 *     tags: [PublicCategories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category detail
 *       404:
 *         description: Not found
 */
publicCategoriesRouter.get("/:slug", getBySlug);
