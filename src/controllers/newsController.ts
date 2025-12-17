import { Request, Response } from "express";
import { prisma } from "../prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { notifyUser } from "../realtime";
import { getCache, setCache, delCache, useRedis, redis } from "../redis";
import { sendSuccess, sendError } from "../response";

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  published: z.boolean().optional(),
  category_name: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  tags: z.string().optional(),
  category_slug: z.string().optional(),
  user_id: z.string().optional(),
  user_name: z.string().optional(),
});

const serializeBigInt = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
};

const VIEW_IP_TTL_SECONDS = 2 * 60 * 60;

export async function listWithFilters(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 400, "Invalid query", errors);
    return;
  }
  const {
    page,
    pageSize,
    title,
    status,
    created_from,
    created_to,
    tags,
    user_id,
    user_name,
  } = parsed.data;
  const pageNumber = Number.isFinite(Number(page))
    ? Math.max(Number(page), 1)
    : 1;
  const sizeNumber = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number(pageSize), 1), 100)
    : 10;
  const where: any = {};
  const user = (req as any).user as
    | { userId: string; role: string }
    | undefined;
  if (user) {
    if (user.role !== "admin") {
      where.user_id = BigInt(user.userId);
    } else if (user_id) {
      const idNum = Number(user_id);
      if (Number.isFinite(idNum) && idNum > 0) {
        where.user_id = BigInt(idNum);
      }
    }
  }
  if (title) {
    const normalizedTitle = title.trim();
    if (normalizedTitle) {
      where.name = { contains: normalizedTitle, mode: "insensitive" };
    }
  }
  if (status) {
    where.status = status;
  }
  if (created_from || created_to) {
    where.created_at = {};
    if (created_from) {
      const from = new Date(created_from);
      if (!Number.isNaN(from.getTime())) {
        where.created_at.gte = from;
      }
    }
    if (created_to) {
      const to = new Date(created_to);
      if (!Number.isNaN(to.getTime())) {
        where.created_at.lte = to;
      }
    }
  }
  if (user && user.role === "admin" && user_name) {
    const normalizedUserName = user_name.trim();
    if (normalizedUserName) {
      where.users = {
        name: { contains: normalizedUserName, mode: "insensitive" },
      };
    }
  }
  if (tags) {
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagList.length > 0) {
      where.OR = tagList.map((tag) => ({
        tags: { contains: tag, mode: "insensitive" as const },
      }));
    }
  }
  const [items, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber,
      include: {
        users: { select: { name: true } },
        categori_posts: { select: { id: true, name: true, slug: true } },
        comments: {
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { name: true } },
          },
        },
      },
    }),
    prisma.posts.count({ where }),
  ]);
  const payload = {
    items: serializeBigInt(items),
    pagination: {
      page: pageNumber,
      pageSize: sizeNumber,
      total,
      totalPages: total > 0 ? Math.ceil(total / sizeNumber) : 0,
    },
  };
  sendSuccess(res, 200, "List posts", payload);
}

// Endpoint publik: list semua berita yang sudah berstatus published (paginate + filter)
export async function listPublic(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 400, "Invalid query", errors);
    return;
  }
  const { page, pageSize, title, tags, category_slug } = parsed.data;
  const pageNumber = Number.isFinite(Number(page))
    ? Math.max(Number(page), 1)
    : 1;
  const sizeNumber = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number(pageSize), 1), 100)
    : 10;
  const where: any = { status: "published" };
  if (title) {
    const normalizedTitle = title.trim();
    if (normalizedTitle) {
      where.name = { contains: normalizedTitle, mode: "insensitive" };
    }
  }
  if (category_slug) {
    where.categori_posts = { slug: category_slug };
  }
  if (tags) {
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagList.length > 0) {
      where.OR = tagList.map((tag) => ({
        tags: { contains: tag, mode: "insensitive" as const },
      }));
    }
  }
  const cacheKey = `news:public:${pageNumber}:${sizeNumber}:${title || ""}:${
    category_slug || ""
  }:${tags || ""}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    sendSuccess(res, 200, "List public news", cached);
    return;
  }
  const [items, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber,
      include: {
        users: { select: { name: true } },
        categori_posts: { select: { id: true, name: true, slug: true } },
        comments: {
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { name: true } },
          },
        },
      },
    }),
    prisma.posts.count({ where }),
  ]);
  const payload = {
    items: serializeBigInt(items),
    pagination: {
      page: pageNumber,
      pageSize: sizeNumber,
      total,
      totalPages: total > 0 ? Math.ceil(total / sizeNumber) : 0,
    },
  };
  await setCache(cacheKey, payload, 60);
  sendSuccess(res, 200, "List public news", payload);
}

// Endpoint internal/terproteksi: detail berita berdasarkan id (dipakai di route admin/user)
export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    sendError(res, 400, "Invalid id");
    return;
  }
  const item = await prisma.posts.findUnique({ where: { id: BigInt(id) } });
  if (!item) {
    sendError(res, 404, "Not found");
    return;
  }
  sendSuccess(res, 200, "News detail", serializeBigInt(item));
}

// Endpoint publik: detail berita berdasarkan slug + update views unik per IP
export async function getBySlug(req: Request, res: Response) {
  const slug = req.params.slug;
  if (!slug) {
    sendError(res, 400, "Invalid slug");
    return;
  }
  const existing = await prisma.posts.findFirst({
    where: { slug, status: "published" },
  });
  if (!existing) {
    sendError(res, 404, "Not found");
    return;
  }
  const currentViews = parseInt((existing as any).views ?? "0", 10);
  let shouldIncrement = true;

  const ip =
    req.ip ||
    (req.headers["x-forwarded-for"] as string | undefined) ||
    req.socket.remoteAddress ||
    "";

  if (useRedis && redis && ip) {
    try {
      const key = `post-view:${String(existing.id)}:${ip}`;
      const already = await redis.exists(key);
      if (already === 1) {
        shouldIncrement = false;
      } else {
        await redis.set(key, "1", "EX", VIEW_IP_TTL_SECONDS);
      }
    } catch {}
  }

  let item;
  if (shouldIncrement) {
    const nextViews = Number.isFinite(currentViews) ? currentViews + 1 : 1;
    item = await prisma.posts.update({
      where: { id: existing.id },
      data: { views: String(nextViews) },
      include: {
        users: { select: { name: true } },
        categori_posts: { select: { id: true, name: true, slug: true } },
        comments: {
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { name: true } },
          },
        },
      },
    });
  } else {
    item = await prisma.posts.findUnique({
      where: { id: existing.id },
      include: {
        users: { select: { name: true } },
        categori_posts: { select: { id: true, name: true, slug: true } },
        comments: {
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { name: true } },
          },
        },
      },
    });
  }
  sendSuccess(res, 200, "News detail", serializeBigInt(item));
}

export async function listMine(req: Request, res: Response) {
  const user = (req as any).user as { userId: string; role: string };
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 400, "Invalid query", errors);
    return;
  }
  const { page, pageSize } = parsed.data;
  const pageNumber = Number.isFinite(Number(page))
    ? Math.max(Number(page), 1)
    : 1;
  const sizeNumber = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number(pageSize), 1), 100)
    : 10;
  const { title, status, created_from, created_to, tags } = parsed.data;
  const where: any = { user_id: BigInt(user.userId) };
  if (status) {
    where.status = status;
  }
  if (title) {
    const normalizedTitle = title.trim();
    if (normalizedTitle) {
      where.name = { contains: normalizedTitle, mode: "insensitive" };
    }
  }
  if (created_from || created_to) {
    where.created_at = {};
    if (created_from) {
      const from = new Date(created_from);
      if (!Number.isNaN(from.getTime())) {
        where.created_at.gte = from;
      }
    }
    if (created_to) {
      const to = new Date(created_to);
      if (!Number.isNaN(to.getTime())) {
        where.created_at.lte = to;
      }
    }
  }
  if (tags) {
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagList.length > 0) {
      where.OR = tagList.map((tag) => ({
        tags: { contains: tag, mode: "insensitive" as const },
      }));
    }
  }
  const cacheKey = `news:mine:${user.userId}:${pageNumber}:${sizeNumber}:${
    title || ""
  }:${where.status || ""}:${created_from || ""}:${created_to || ""}:${
    tags || ""
  }`;
  const cached = await getCache(cacheKey);
  if (cached) {
    sendSuccess(res, 200, "List my news", cached);
    return;
  }
  const [items, total] = await Promise.all([
    prisma.posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (pageNumber - 1) * sizeNumber,
      take: sizeNumber,
      include: {
        users: { select: { name: true } },
        categori_posts: { select: { id: true, name: true, slug: true } },
        comments: {
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { name: true } },
          },
        },
      },
    }),
    prisma.posts.count({ where }),
  ]);
  const payload = {
    items: serializeBigInt(items),
    pagination: {
      page: pageNumber,
      pageSize: sizeNumber,
      total,
      totalPages: total > 0 ? Math.ceil(total / sizeNumber) : 0,
    },
  };
  await setCache(cacheKey, payload, 60);
  sendSuccess(res, 200, "List my news", payload);
}

// Fungsi helper internal: ambil atau buat kategori default untuk user tertentu
async function getOrCreateCategory(userId: bigint, name: string = "General") {
  let category = await prisma.categori_posts.findFirst({ where: { name } });
  if (!category) {
    category = await prisma.categori_posts.create({
      data: {
        uuid: uuidv4(),
        user_id: userId,
        name,
        slug: slugify(name, { lower: true }) + "-" + uuidv4().slice(0, 8),
        status: "active",
      },
    });
  }
  return category.id;
}

// Endpoint terproteksi: membuat berita baru untuk user yang sedang login
export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 422, "Validation error", errors);
    return;
  }
  const user = (req as any).user as { userId: string; role: string };
  const userIdBig = BigInt(user.userId);

  const categoryId = await getOrCreateCategory(
    userIdBig,
    parsed.data.category_name
  );
  const slug =
    slugify(parsed.data.title, { lower: true }) + "-" + uuidv4().slice(0, 8);

  const item = await prisma.posts.create({
    data: {
      uuid: uuidv4(),
      user_id: userIdBig,
      categori_id: categoryId,
      name: parsed.data.title,
      slug: slug,
      content: parsed.data.content,
      status: parsed.data.published ? "published" : "draft",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  await delCache("news:public");
  await delCache(`news:mine:${user.userId}`);
  notifyUser(user.userId, "post:created", serializeBigInt(item));
  sendSuccess(res, 201, "News created", serializeBigInt(item));
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

// Endpoint terproteksi: update berita milik user (atau admin)
export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    sendError(res, 400, "Invalid id");
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    sendError(res, 422, "Validation error", errors);
    return;
  }
  const user = (req as any).user as { userId: string; role: string };
  const existing = await prisma.posts.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    sendError(res, 404, "Not found");
    return;
  }

  const userIdBig = BigInt(user.userId);
  if (existing.user_id !== userIdBig && user.role !== "admin") {
    sendError(res, 403, "Forbidden");
    return;
  }

  const data: any = {};
  if (parsed.data.title) {
    data.name = parsed.data.title;
    data.slug =
      slugify(parsed.data.title, { lower: true }) +
      "-" +
      existing.uuid.slice(0, 8);
  }
  if (parsed.data.content) data.content = parsed.data.content;
  if (parsed.data.published !== undefined)
    data.status = parsed.data.published ? "published" : "draft";
  data.updated_at = new Date();

  const item = await prisma.posts.update({ where: { id: BigInt(id) }, data });
  await delCache("news:public");
  await delCache(`news:mine:${user.userId}`);
  notifyUser(user.userId, "post:updated", serializeBigInt(item));
  sendSuccess(res, 200, "News updated", serializeBigInt(item));
}

// Endpoint terproteksi: hapus berita milik user (atau admin)
export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    sendError(res, 400, "Invalid id");
    return;
  }
  const user = (req as any).user as { userId: string; role: string };
  const existing = await prisma.posts.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    sendError(res, 404, "Not found");
    return;
  }

  const userIdBig = BigInt(user.userId);
  if (existing.user_id !== userIdBig && user.role !== "admin") {
    sendError(res, 403, "Forbidden");
    return;
  }
  await prisma.posts.delete({ where: { id: BigInt(id) } });
  await delCache("news:public");
  await delCache(`news:mine:${user.userId}`);
  notifyUser(user.userId, "post:deleted", { id });
  sendSuccess(res, 200, "News deleted", null);
}
