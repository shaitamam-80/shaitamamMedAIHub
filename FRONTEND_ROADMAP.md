# Frontend Restoration Roadmap

## 🎯 Goal
Restore the "Clinical High-End" design system and rebuild the Define & Query pages with full functionality.

---

## ✅ Already Completed

### Backend (100% Done)
- ✅ Gemini 2.0-flash configuration
- ✅ Updated Pydantic schemas (QueryGenerateResponse with toolbox/concepts)
- ✅ Modular prompts system (14 frameworks, 5 validated hedges)
- ✅ AI Service with robust JSON parsing
- ✅ API Routes updated (Define & Query)
- ✅ Hebrew text support (ensure_ascii=False)

### Frontend Setup
- ✅ Dependencies installed: `@radix-ui/react-tabs`, `react-markdown`, `lucide-react`
- ✅ Base Next.js 15 app running on http://localhost:3000

---

## 📋 Remaining Tasks

### Phase 1: Design System & Global Styles (30 min)

#### 1.1 Update `frontend/app/globals.css`
**What to change:**
```css
:root {
  /* Replace primary blue with Clinical Emerald */
  --primary: 158 64% 52%;  /* Emerald-500 */
  --primary-foreground: 0 0% 100%;

  /* Deep Slate backgrounds */
  --background: 222 47% 11%;
  --card: 217 33% 17%;
  --muted: 217 33% 17%;
  --border: 217 33% 24%;
}

/* Add custom utilities */
@layer utilities {
  .glass-panel {
    @apply bg-card/40 backdrop-blur-xl border border-border/50;
  }

  .transition-clinical {
    @apply transition-all duration-300 ease-in-out;
  }
}
```

#### 1.2 Update `frontend/tailwind.config.ts`
**Add fonts:**
```typescript
import { fontFamily } from "tailwindcss/defaultTheme"

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", ...fontFamily.sans],
        mono: ["JetBrains Mono", ...fontFamily.mono],
      }
    }
  }
}
```

#### 1.3 Update `frontend/app/layout.tsx`
**Add Google Fonts import:**
```typescript
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

---

### Phase 2: UI Components (45 min)

#### 2.1 Create `frontend/components/ui/badge.tsx`
**Features:**
- Variants: default, emerald, slate, destructive
- Rounded corners (`rounded-full`)
- Clinical color scheme

**Example usage:**
```tsx
<Badge variant="emerald">PICO</Badge>
<Badge variant="slate">MeSH Term</Badge>
```

#### 2.2 Create `frontend/components/ui/tabs.tsx`
**Features:**
- Radix UI Tabs primitive
- Clinical slate background for inactive tabs
- Emerald highlight for active tab
- Smooth transitions

**Example usage:**
```tsx
<Tabs defaultValue="broad">
  <TabsList>
    <TabsTrigger value="broad">Broad</TabsTrigger>
    <TabsTrigger value="focused">Focused</TabsTrigger>
  </TabsList>
  <TabsContent value="broad">...</TabsContent>
</Tabs>
```

#### 2.3 Update `frontend/components/ui/card.tsx`
**Changes:**
- Add `hover:shadow-lg hover:border-primary/50` transitions
- Use `glass-panel` class for depth

---

### Phase 3: API Integration (30 min)

#### 3.1 Update `frontend/lib/api.ts`
**Add new interfaces:**
```typescript
interface ConceptAnalysis {
  concept_number: number;
  component: string;
  free_text_terms: string[];
  mesh_terms: string[];
}

interface QueryStrategies {
  broad: string;
  focused: string;
  clinical_filtered: string;
}

interface ToolboxItem {
  label: string;
  query: string;
}

interface QueryGenerateResponse {
  message: string;  // Markdown
  concepts: ConceptAnalysis[];
  queries: QueryStrategies;
  toolbox: ToolboxItem[];
  framework_type: string;
  framework_data: Record<string, any>;
}
```

**Update method:**
```typescript
async generateQuery(projectId: string): Promise<QueryGenerateResponse> {
  return this.request(`/api/v1/query/generate`, {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      framework_data: {} // Will be fetched from project
    })
  });
}
```

---

### Phase 4: Query Page Rebuild (2 hours)

#### 4.1 File: `frontend/app/query/page.tsx`
**Layout Structure:**
```
┌─────────────────────────────────────────┐
│  Header: "PubMed Query Generator"      │
│  [Select Project] [Generate Button]    │
├──────────────┬──────────────────────────┤
│              │                          │
│  Concepts    │   Strategy Cards         │
│  Table       │   [Broad] [Focused]      │
│  (Left 30%)  │   [Clinical Filtered]    │
│              │                          │
│              │   Toolbox Filters        │
│              │   [Chip] [Chip] [Chip]   │
└──────────────┴──────────────────────────┘
```

**Key Features:**
1. **Concept Analysis Table** (Left column):
   - Component name
   - Free-text terms (badges)
   - MeSH terms (badges with different color)

2. **Strategy Cards** (Right top):
   - 3 cards side-by-side
   - Each card has: Title, Description, Copy button
   - Use `Tabs` component to switch between them
   - Syntax highlighting for queries (use `<code>` with mono font)

3. **Toolbox Section** (Right bottom):
   - Render as clickable chips/badges
   - Click to copy to clipboard
   - Show toast notification on copy

4. **Markdown Analysis** (Above cards):
   - Use `react-markdown` to render the `message` field
   - Style headings, lists, bold text

5. **Empty State**:
   - Show when no query generated yet
   - Display project info
   - Prominent "Generate Query" button

**State Management:**
```typescript
const [project, setProject] = useState<any>(null);
const [queryResult, setQueryResult] = useState<QueryGenerateResponse | null>(null);
const [loading, setLoading] = useState(false);
const [selectedStrategy, setSelectedStrategy] = useState<'broad' | 'focused' | 'clinical_filtered'>('focused');
```

**Key Functions:**
```typescript
async function handleGenerate() {
  setLoading(true);
  try {
    const result = await apiClient.generateQuery(projectId);
    setQueryResult(result);
  } catch (error) {
    toast.error("Failed to generate query");
  } finally {
    setLoading(false);
  }
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard!`);
}
```

---

### Phase 5: Define Page Rebuild (1.5 hours)

#### 5.1 File: `frontend/app/define/page.tsx`
**Layout Structure (Split Screen):**
```
┌──────────────────┬──────────────────────┐
│                  │                      │
│  Framework Form  │   AI Chat Interface  │
│  (Left 50%)      │   (Right 50%)        │
│                  │                      │
│  [P] Population  │   User: ...          │
│  [I] Intervention│   AI: ...            │
│  [C] Comparison  │                      │
│  [O] Outcome     │   [Message Input]    │
│                  │   [Send Button]      │
│  [Export] [Clear]│                      │
└──────────────────┴──────────────────────┘
```

**Key Features:**
1. **Chat Messages with Markdown**:
   - Use `react-markdown` to render AI responses
   - Support headings, bold, lists
   - User messages: right-aligned, emerald background
   - AI messages: left-aligned, slate background

2. **Framework Form Auto-Population**:
   - Listen for changes in `queryResult.framework_data`
   - Update form fields automatically
   - Show visual feedback when fields are filled by AI

3. **Export Protocol Button**:
   - Generate a `.txt` file with:
     - Project name
     - Framework type & data
     - Full conversation history
     - Timestamp
   - Trigger download

4. **Clear History Button**:
   - Confirm dialog before clearing
   - Clear conversation from database
   - Reset form fields

**Export Function:**
```typescript
function exportProtocol() {
  const content = `
MedAI Hub - Research Protocol Export
=====================================
Project: ${project.name}
Framework: ${project.framework_type}
Generated: ${new Date().toISOString()}

Framework Data:
---------------
${Object.entries(project.framework_data || {})
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Conversation History:
---------------------
${conversation.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name}-protocol-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### Phase 6: Polish & Testing (1 hour)

#### 6.1 Add Loading States
- Skeleton loaders for Query generation
- Spinner for chat messages
- Disabled states for buttons

#### 6.2 Error Handling
- Toast notifications for all errors
- Retry buttons
- Graceful fallbacks

#### 6.3 Responsive Design
- Test on mobile (stack layout instead of side-by-side)
- Ensure scrolling works in chat
- Mobile-friendly buttons

#### 6.4 Accessibility
- Keyboard navigation for tabs
- ARIA labels for buttons
- Focus states for all interactive elements

---

## 📦 Dependencies Already Installed

```json
{
  "@radix-ui/react-tabs": "^1.x",
  "react-markdown": "^9.x",
  "lucide-react": "^0.x"
}
```

You may also want to add:
```bash
npm install react-hot-toast  # For toast notifications
npm install @radix-ui/react-dialog  # For confirm dialogs
```

---

## 🎨 Design Tokens Reference

### Colors (CSS Variables)
```css
--primary: 158 64% 52%        /* Emerald-500 */
--background: 222 47% 11%     /* Deep Slate */
--card: 217 33% 17%           /* Slate-800 */
--border: 217 33% 24%         /* Slate-700 */
--muted: 217 33% 17%          /* Slate-800 */
```

### Typography
- **Headings**: Plus Jakarta Sans (700 weight)
- **Body**: Plus Jakarta Sans (400 weight)
- **Code/Queries**: JetBrains Mono (400 weight)

### Spacing
- Card padding: `p-6` (1.5rem)
- Section gaps: `space-y-6` (1.5rem)
- Grid gaps: `gap-4` (1rem)

---

## 🚀 Quick Start Commands

```bash
# Backend (Terminal 1)
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Frontend (Terminal 2)
cd frontend
npm run dev
```

**Endpoints:**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Frontend: http://localhost:3000

---

## 📝 Notes for Next Session

1. **Backend is 100% ready** - all APIs working, Gemini 2.0-flash configured
2. **Frontend structure exists** - just needs UI/UX updates
3. **Dependencies installed** - react-markdown, tabs, lucide-react ready
4. **Priority order**: Styles → Components → Query Page → Define Page
5. **Estimated total time**: 5-6 hours for full restoration

---

## ✅ Success Criteria

When done, you should be able to:
1. Select a project and see its framework type
2. Chat with AI in Define tool and see form auto-populate
3. Export protocol as `.txt` file
4. Generate PubMed query with 3 strategies
5. See concept analysis table with MeSH terms
6. Click toolbox items to copy modifiers
7. Copy any query to clipboard with one click
8. All rendered with the Clinical Emerald + Deep Slate theme

---

Good luck! 🚀
