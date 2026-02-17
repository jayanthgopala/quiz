import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

import { env } from "./config/env.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import proctorRoutes from "./routes/proctorRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: false
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());
app.use(apiRateLimit);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/api", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/proctor", proctorRoutes);

app.use((err, _req, res, _next) => {
  return res.status(500).json({ message: "Internal server error", error: err.message });
});

export { app };
