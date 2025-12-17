import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger";
import { authRouter } from "./routes/api/auth";
import { postsRouter } from "./routes/api/posts";
import { categoriesRouter } from "./routes/api/categories";
import { commentsRouter } from "./routes/api/comments";
import { publicPostsRouter } from "./routes/api/public/posts";
import { publicCategoriesRouter } from "./routes/api/public/categories";
import { visitorCounter } from "./middleware/visitor";
import { errorHandler } from "./middleware/error";

export const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ["x-access-token", "x-access-expires-at"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(visitorCounter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/public/posts", publicPostsRouter);
app.use("/api/public/categories", publicCategoriesRouter);

app.use(errorHandler);
