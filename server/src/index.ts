import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import { attachUser } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import clockRouter from "./routes/clock.js";
import ingestRouter from "./routes/ingest.js";
import geofencesRouter from "./routes/geofences.js";
import tripsRouter from "./routes/trips.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/clock", clockRouter);
app.use("/ingest", ingestRouter);
app.use("/admin", geofencesRouter);
app.use("/user", tripsRouter);

async function start() {
  await connectDatabase();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API on :${port}`));
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
