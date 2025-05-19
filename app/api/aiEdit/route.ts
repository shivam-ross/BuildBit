import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { editSchema } from "@/lib/zodSchema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST (request : NextRequest) {
    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { success } = editSchema.safeParse(body);

    if (!success) {
        return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }

    const prompt = `Make change in the HTML file: ${body.html} ,based on the user prompt: ${body.prompt}.
    The website must be same as the previos one only make changes based on the user prompt.
    Return only the HTML string, with no additional text, explanations, or comments outside the HTML code start from !<Doctype Html> and do not add anything at start or end.
    Ensure the code is clean, well-indented, and free of errors (e.g., unclosed tags or invalid attributes).`


    try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" }); // Upgraded to a more capable model
            const result = await model.generateContent(prompt);
            let site = result.response.text();
    
            // Validate Pexels image URLs
            const imageUrls = site.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/g) || [];
            for (const url of imageUrls) {
                try {
                    await axios.head(url);
                } catch {
                    // Replace invalid image with a verified fallback
                    site = site.replace(url, "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg");
                }
            }
            site = site.replace("```html", ""); // Remove at start
            site = site.replace("```", ""); // Remove at end
           
    
            return new Response(JSON.stringify(site), { status: 200 });
        } catch {
            return new Response("internal server error", { status: 500 });
        }
}