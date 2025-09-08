import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

export function audit() {
  return async (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    const start = Date.now();
    const finish = async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.userId ? String(req.userId) : null,
            action: `${req.method} ${req.path}`,
            method: req.method,
            path: req.path,
            ip: ((req.headers["x-forwarded-for"] as string) || req.ip || null),
            userAgent: req.headers["user-agent"] || null,
            metadata: { durationMs: Date.now() - start },
          },
        });
      } catch {}
    };
    resFinishOnce(req, finish);
    next();
  };
}

function resFinishOnce(req: any, cb: () => void) {
  const res = (req as any).res;
  if (!res) return;
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    setTimeout(cb, 0);
  };
  res.on("finish", once);
  res.on("close", once);
}

