# BuildBit — AI-Powered Website Builder

Describe the website you want. AI builds it. You refine it visually, then export the code.

BuildBit takes a plain-English prompt and generates a complete, production-quality landing page using **Gemini 2.5 Pro** — multi-section layout, modern styling, real images — then hands it to a **GrapesJS visual editor** where you can drag, drop, and tweak everything. Ask the AI to edit with natural-language prompts, and export the finished site as a downloadable ZIP.

## ✨ Features

- **Prompt → website**: Generate a full single-page site (hero, about, services, portfolio, team, testimonials, pricing, contact, footer) from one sentence.
- **AI editing**: Change anything with a natural-language prompt — "make the hero darker", "add a pricing tier" — powered by Gemini 2.5 Pro.
- **Visual editor**: Fine-tune the generated site with a drag-and-drop GrapesJS editor.
- **Smart image handling**: Generated image URLs are validated live against Pexels; broken ones are swapped for a verified fallback automatically.
- **Export your site**: Download the finished website as a ZIP file.
- **Accounts & projects**: Sign in, and all your generated sites are saved to your project dashboard (PostgreSQL + Prisma).
- **Input validation**: All AI endpoints validate requests with Zod schemas.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion, Anime.js |
| AI | Google Gemini 2.5 Pro (`@google/generative-ai`) |
| Visual editor | GrapesJS + webpage preset |
| Auth | NextAuth.js (credentials + OAuth) with Prisma adapter |
| Database | PostgreSQL via Prisma ORM |
| Export | JSZip + file-saver |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### Setup

```bash
git clone https://github.com/shivam-ross/BuildBit.git
cd BuildBit
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/buildbit"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
# + any OAuth provider credentials (see lib/auth.ts)
```

Then:

```bash
npx prisma migrate dev   # set up the database
npm run dev              # start at http://localhost:3000
```

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/create` | POST | `{ prompt }` → generates a full site with Gemini, validates images, saves the project, returns its ID. Auth required. |
| `/api/aiEdit` | POST | `{ html, prompt }` → applies a natural-language edit to existing HTML, returns the updated site. Auth required. |
| `/api/projects` | — | Project CRUD for the dashboard. |
| `/api/auth/[...nextauth]` | — | NextAuth.js authentication. |

## 📁 Project Structure

```
app/
  api/
    create/route.ts    # prompt → Gemini → validated HTML → saved project
    aiEdit/route.ts    # natural-language edits to existing HTML
    projects/          # project management endpoints
    auth/              # NextAuth.js handlers
  project/[id]/        # per-project editor view
  actions/             # server actions
components/
  editor/              # GrapesJS visual editor + ZIP export
  projects.tsx         # project dashboard
  signin.tsx, loading/ # auth & UI helpers
lib/
  auth.ts              # NextAuth configuration
  db.ts                # Prisma client
  zodSchema.ts         # request validation schemas
prisma/
  schema.prisma        # User, Account, Session, Projects models
```

## 🧠 How the generation works

1. Your prompt is wrapped in a detailed system prompt specifying structure (8–10 sections), design language (gradients, glassmorphism, responsive grids), and output format (clean HTML only).
2. Gemini 2.5 Pro returns the full page.
3. Every Pexels image URL in the output is HEAD-checked; dead links are replaced with a verified fallback.
4. Markdown fences are stripped, and the site is saved to your projects.

## 📌 Roadmap

- Live deployment link
- Custom domains / one-click publish
- Multi-page site generation
- Template gallery

---

Built solo by [Shivam Ross](https://github.com/shivam-ross) — an AI website builder good enough to get its builder hired on a live demo.
