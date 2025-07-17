import { NEXT_AUTH_CONFIG } from "@/lib/auth";
import { createSchema } from "@/lib/zodSchema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import axios from "axios";

export async function POST(request: NextRequest) {

    const session = await getServerSession(NEXT_AUTH_CONFIG);
    if (!session || !session.user.id) {
        return new Response("unauthenticated", { status: 401 });
    }

    const body = await request.json();
    const { success } = createSchema.safeParse(body);

    if (!success) {
        return new Response("invalid inputs", { status: 400 });
    }

    const prompt = `Generate a complete single-page HTML file for a visually sophisticated and professional landing page based on the user prompt: ${body.prompt}.
    The website must adhere to the following requirements:

    1. **Structure and Content**:
       - Include 8-10 distinct sections, such as hero, about, services, portfolio, team, testimonials, pricing, contact, and optionally blog or FAQ, each with a unique ID for navigation (e.g., id="hero").
       - Provide a fixed navigation bar at the top with smooth-scrolling links to each section.
       - Include a footer with a copyright notice and social media links (e.g., Facebook, Twitter, LinkedIn).
       - Ensure the HTML is valid, starts with <!DOCTYPE html>, and includes meta tags for charset (UTF-8) and responsive viewport.

    2. **Design and Styling**:
       - Use inline CSS and tailwind CSS classes for styling, ensuring a modern and clean aesthetic Use "https://cdn.tailwindcss.com" this link for tailwind css.

       - Use modern design trends, such as:
         - Gradients (e.g., linear or radial) for backgrounds or buttons.
         - Glassmorphism (translucent cards with blur) or neumorphism for interactive elements.
         - Bold, clean typography with a professional font stack (e.g., 'Poppins', 'Inter', or 'Roboto').
         - Subtle animations (e.g., fade-in, scale on hover, or slide-in effects) for section transitions or interactive elements.
       - Implement advanced CSS layouts using CSS Grid for multi-column sections (e.g., portfolio, team) and Flexbox for navigation and other components.
       - Use a consistent color scheme (e.g., blues and purples, or tones derived from the user prompt) with a primary color, secondary color, and accent color.
       - Ensure responsiveness with media queries for mobile (max-width: 768px) and tablet (max-width: 1024px) devices, adjusting font sizes, padding, and layouts as needed.
       - Apply smooth scrolling via CSS (scroll-behavior: smooth).
       - Add hover effects (e.g., scale, color change, or shadow) for buttons, cards, and portfolio items.
       - Use box-shadows, border-radius, and padding to create depth and visual hierarchy.

    3. **Images**:
       - Use only valid, publicly accessible images from Pexels with URLs in the format https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg.
       - Ensure all images are relevant to the section content (e.g., tech-related for services, team photos for team section).
       - Apply CSS to ensure images are responsive (e.g., object-fit: cover) and optimized for display (e.g., fixed height/width ratios).
       - Use background images with overlays (e.g., dark gradient) for the hero section to enhance text readability.

    4. **Section-Specific Requirements**:
       - **Hero**: Full-screen height (100vh), centered text with a bold headline, subheading, and call-to-action button. Use a high-quality Pexels background image.
       - **About**: Three-column grid showcasing mission, vision, and values, each with an image and brief text.
       - **Services**: Grid of 3-4 cards, each with an image, title, and description.
       - **Portfolio**: Grid of 3-6 items with images and hover overlays revealing project names or descriptions.
       - **Team**: Grid of 3-4 team members with circular profile images, names, and roles.
       - **Testimonials**: Grid of 3-4 quotes with client names, styled as cards or speech bubbles.
       - **Pricing**: Three pricing tiers in a grid, each with a title, price, feature list, and button.
       - **Contact**: Form with name, email, and message fields, styled with modern input designs (e.g., focus effects, rounded borders).
       - **Footer**: Centered text with copyright and social media links styled as icons or text.

    5. **Additional Features**:
       - Ensure mobile-friendliness with collapsible navigation (e.g., hamburger menu) for small screens.
       - Optimize for performance by minimizing CSS complexity while maintaining visual appeal.
       - Use semantic HTML5 elements (e.g., <nav>, <section>, <footer>).
       - Include subtle micro-interactions (e.g., button ripple effects or card tilts) to enhance user experience.

    6. **Output**:
       - Return only the HTML string, with no additional text, explanations, or comments outside the HTML code start from !<Doctype Html> and do not add anything at start or end.
       - Ensure the code is clean, well-indented, and free of errors (e.g., unclosed tags or invalid attributes).

    Example aesthetic: A sleek tech startup website with a blue-purple gradient theme, glassmorphic cards, smooth animations, and high-quality Pexels images.`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" }); // Upgraded to a more capable model
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
       

        const res = await prisma.projects.create({
            data: {
                prompt: body.prompt,
                content: site,
                userId: session.user.id
            }
        });

        return new Response(JSON.stringify(res), { status: 200 });
    } catch {
        
        return new Response("internal server error", { status: 500 });
    }
}





