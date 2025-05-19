'use server'

import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function fetchProject(page: number,) {
    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session || !session.user.id) {
        return new Response("unauthenticated", { status: 401 });
    }
    try {
        const res = await prisma.projects.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * 10,
          take: 10,
          select: {
            id: true,
            prompt: true
          }
        });
    
        return { res, hasMore: res.length === 10 };
      } catch (error) {
        console.error("Error getting entries:", error);
        return { error: "Internal Server Error" };
      }
}
