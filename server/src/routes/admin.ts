import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/employees", requireRole("admin"), async (_req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({ select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } });
  res.json({ employees });
});

export default router;

