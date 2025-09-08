import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDatabase } from "./db.js";
import { attachUser } from "./middleware/auth.js";
import { audit } from "./middleware/audit.js";
import { rateLimit } from "./middleware/rateLimit.js";
import authRouter from "./routes/auth.js";
import clockRouter from "./routes/clock.js";
import ingestRouter from "./routes/ingest.js";
import geofencesRouter from "./routes/geofences.js";
import tripsRouter from "./routes/trips.js";
import analyticsRouter from "./routes/analytics.js";
import adminRouter from "./routes/admin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);
app.use(audit());
app.use("/ingest", rateLimit(120));
app.use("/auth", rateLimit(30));

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/clock", clockRouter);
app.use("/ingest", ingestRouter);
app.use("/admin", geofencesRouter);
app.use("/admin", adminRouter);
app.use("/admin", analyticsRouter);
app.use("/user", tripsRouter);

// serve dashboard
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/dashboard", express.static(path.join(__dirname, "public")));

async function start() {
  await connectDatabase();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API on :${port}`));
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
