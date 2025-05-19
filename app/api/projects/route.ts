import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session || !session.user.id) {
        return new Response("unauthenticated", { status: 401 });
    }

    const body = await request.json();
    const id = body.id;
    if (!id) {
        return new Response("invalid inputs", { status: 400 });
    }
    try {
        const res = await prisma.projects.findUnique({
            where: { id: id }
        });

        if (!res) {
            return new Response("not found", { status: 404 });
        }

        return new Response(JSON.stringify(res), { status: 200 });
    }
    catch (error) {
        console.error("Error getting entries:", error);
        return new Response("Internal Server Error", { status: 500 });
    }

   
        
};


export async function PUT(request: NextRequest) {
    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session || !session.user.id) {
        return new Response("unauthenticated", { status: 401 });
    }

    const body = await request.json();
    const id = body.id;
    const completeHtml = body.completeHtml;

    if (!id || !completeHtml) {
        return new Response("invalid inputs", { status: 400 });
    }

    try {
        const res = await prisma.projects.update({
            where: { id: id },
            data: { content: completeHtml }
        });

        if (!res) {
            return new Response("not found", { status: 404 });
        }

        return new Response(JSON.stringify(res), { status: 200 });
    } catch (error) {
        console.error("Error updating entries:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}