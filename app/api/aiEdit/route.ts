import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { editSchema } from "@/lib/zodSchema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const maxDuration = 300; // Add this just in case, though not the 94ms issue

export async function POST (request : NextRequest) {
    console.log("Function started"); // Log 1

    const session = await getServerSession(NEXT_AUTH_CONFIG);
    console.log("Session obtained:", !!session); // Log 2
    if (!session) {
        console.error("Unauthorized session");
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body); // Log 3
    const { success } = editSchema.safeParse(body);
    console.log("Schema validation success:", success); // Log 4

    if (!success) {
        console.error("Invalid input detected");
        return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }

    const prompt = `Make change in the HTML file: ${body.html} ,based on the user prompt: ${body.prompt}.
    The website must be same as the previos one only make changes based on the user prompt.
    Return only the HTML string, with no additional text, explanations, or comments outside the HTML code start from !<Doctype Html> and do not add anything at start or end.
    Ensure the code is clean, well-indented, and free of errors (e.g., unclosed tags or invalid attributes).`

    try {
        console.log("Initializing GoogleGenerativeAI"); // Log 5
        // This is the most likely culprit for a 94ms failure if env var is missing
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        console.log("GoogleGenerativeAI initialized"); // Log 6
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        console.log("Model obtained, generating content..."); // Log 7
        const result = await model.generateContent(prompt);
        let site = result.response.text();
        console.log("Content generated, starting Pexels validation."); // Log 8

        // Validate Pexels image URLs
        const imageUrls = site.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/g) || [];
        for (const url of imageUrls) {
            try {
                await axios.head(url);
                console.log(`Validated Pexels URL: ${url}`); // Log 9
            } catch (imgError) {
                console.error(`Invalid Pexels URL: ${url}, replacing. Error: ${imgError}`); // Log 10
                // Replace invalid image with a verified fallback
                site = site.replace(url, "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg");
            }
        }
        site = site.replace("```html", ""); // Remove at start
        site = site.replace("```", ""); // Remove at end

        console.log("Function completed successfully."); // Log 11
        return new Response(JSON.stringify(site), { status: 200 });
    } catch (error) {
        console.error("Internal server error caught:", error); // Log 12 - This will show the actual error
        return new Response("internal server error", { status: 500 });
    }
}