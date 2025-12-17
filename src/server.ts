import express from "express";
import cors from "cors";
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

app.use(cors());
app.use(express.json());
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
