import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

