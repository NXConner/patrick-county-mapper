import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/rbac.js";
import { createClient } from "@supabase/supabase-js";
import SegmentationService from "../services/ai/segmentationService.js";

const router = Router();

router.get("/employees", requireRole("admin"), async (_req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } });
  res.json({ employees });
});

// Quick endpoint to run a segmentation against current AOI without queuing
router.post("/ai/segment", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const svc = new SegmentationService();
    const aoi = req.body?.aoi;
    const imageUrl = req.body?.imageUrl;
    const out = await svc.segmentAsphalt({ aoi, imageUrl, model: req.body?.model });
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: String(e?.message || e) });
  }
});

// Minimal endpoints to list and get AI jobs via Supabase (for debugging)
router.get("/ai/jobs", requireRole("admin"), async (_req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return res.json({ jobs: [] });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from("ai_jobs").select("*").order("created_at", { ascending: false }).limit(20);
  res.json({ jobs: data ?? [] });
});

router.get("/ai/jobs/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(404).json({ error: "Not configured" });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("ai_jobs").select("*").eq("id", req.params.id).single();
  if (error || !data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

export default router;

