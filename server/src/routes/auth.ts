import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, fullName, password } = req.body ?? {};
    if (!email || !fullName || !password) return res.status(400).json({ error: "Missing fields" });
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({ data: { email, fullName, passwordHash } });
    return res.json({ id: employee.id, email: employee.email, fullName: employee.fullName });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, employee.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: employee.id, email: employee.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

