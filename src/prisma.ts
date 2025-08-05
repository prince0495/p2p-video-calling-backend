import { PrismaClient } from "../generated/prisma";

const globalForPrisma = global as unknown as { globalPrismaClient: PrismaClient };

export const globalPrismaClient =
  globalForPrisma.globalPrismaClient || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.globalPrismaClient = globalPrismaClient;