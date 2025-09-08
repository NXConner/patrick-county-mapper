import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/geofences", async (_req: Request, res: Response) => {
  const items = await prisma.geofence.findMany();
  res.json(items);
});

router.post("/geofences", async (req: Request, res: Response) => {
  const { name, description, type, centerLat, centerLng, radiusMeters, polygon, isActive } = req.body ?? {};
  if (!name || !type) return res.status(400).json({ error: "Missing fields" });
  const gf = await prisma.geofence.create({
    data: { name, description, type, centerLat, centerLng, radiusMeters, polygon, isActive: isActive ?? true },
  });
  res.json(gf);
});

router.put("/geofences/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const data = req.body ?? {};
  const gf = await prisma.geofence.update({ where: { id }, data });
  res.json(gf);
});

router.delete("/geofences/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  await prisma.geofence.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;

