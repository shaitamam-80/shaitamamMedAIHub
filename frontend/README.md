# MedAI Hub - Frontend

Next.js 15 frontend for the MedAI Hub systematic literature review platform.

## Features

- **Modern Stack**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI for beautiful, accessible components
- **Responsive Design**: Mobile-first responsive layout
- **Persistent Sidebar**: Easy navigation between tools
- **Real-time Chat**: Streaming AI responses in the Define tool
- **Dynamic Forms**: Framework-specific forms that adapt based on selection

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn/UI (Radix UI primitives)
- **Icons**: Lucide React

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Set your backend API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with sidebar
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles & Tailwind
│   ├── define/
│   │   └── page.tsx         # Define tool (split screen)
│   ├── query/
│   │   └── page.tsx         # Query tool
│   ├── review/
│   │   └── page.tsx         # Review tool
│   └── projects/
│       └── page.tsx         # Projects management
│
├── components/
│   ├── ui/                  # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   └── textarea.tsx
│   └── sidebar/
│       └── app-sidebar.tsx  # Main sidebar component
│
├── lib/
│   ├── utils.ts            # Utility functions (cn)
│   └── api.ts              # API client
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Key Features

### Split Screen Define Tool

The Define tool features a unique split-screen layout:
- **Left**: Dynamic form that adapts to the selected research framework (PICO, CoCoPop, etc.)
- **Right**: Real-time chat interface with AI assistant
- **Auto-extraction**: AI automatically populates form fields as you chat

### Dynamic Framework Support

The platform supports multiple research frameworks:
- **PICO**: Population, Intervention, Comparison, Outcome
- **CoCoPop**: Condition, Context, Population
- **PEO**: Population, Exposure, Outcome
- **SPIDER**: Sample, Phenomenon of Interest, Design, Evaluation, Research type
- **SPICE**: Setting, Perspective, Intervention, Comparison, Evaluation
- **ECLIPSE**: Expectation, Client group, Location, Impact, Professionals, Service
- **FINER**: Feasible, Interesting, Novel, Ethical, Relevant

Forms dynamically render based on the selected framework.

## API Integration

The frontend connects to the FastAPI backend via the API client (`lib/api.ts`).

Key endpoints:
- **Projects**: CRUD operations for projects
- **Define**: Chat and framework data extraction
- **Query**: PubMed query generation
- **Review**: File upload and abstract screening

## Styling

The app uses Tailwind CSS with a custom theme defined in `tailwind.config.ts` and CSS variables in `globals.css`.

Color scheme supports both light and dark modes (toggle can be added).

## Development

### Adding New Components

Use Shadcn/UI to add new components:

```bash
# Example: Add a dialog component
npx shadcn-ui@latest add dialog
```

### Code Style

- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use "use client" directive for client-side components
- Keep components small and focused

## Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy to Vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### API Connection Issues

If the frontend can't connect to the backend:
1. Check that the backend is running on http://localhost:8000
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS settings in the backend

### Build Errors

If you encounter build errors:
```bash
rm -rf .next node_modules
npm install
npm run build
```
