# Query Tool Components

This directory contains React components for the Query Tool interface.

## Components

### ToolboxAccordion

A collapsible accordion component that displays optional PubMed search filters organized by category.

#### Features

- **Organized by Category**: Filters are grouped into categories (Age, Article Type, Publication Date, Language, Study Design, Advanced)
- **Color-Coded Borders**: Each category has a distinct colored left border for easy visual identification
- **Category Icons**: Lucide icons represent each category type
- **Active Filter Tracking**: Shows which filters are currently applied to the query
- **Copy to Clipboard**: Quick copy button for each filter's query syntax
- **Add Filter**: One-click button to append filter to current query
- **Collapsible Sections**: Uses Radix UI Accordion with smooth animations
- **Filter Count Badges**: Shows number of filters in each category and total available

#### Props

```typescript
interface ToolboxAccordionProps {
  filters: ToolboxFilter[];           // Array of filter objects
  onAddFilter: (filter: ToolboxFilter) => void;  // Callback when "Add" is clicked
  onCopyFilter: (query: string) => void;         // Callback when "Copy" is clicked
  activeFilters?: string[];           // Labels of currently active filters (optional)
}

interface ToolboxFilter {
  category: string;      // "Age Filters", "Article Type", etc.
  label: string;         // Human-readable name: "Adults (19+ years)"
  query: string;         // PubMed query syntax: "AND (adult[mh] OR ...)"
  description?: string;  // Optional explanation of what the filter does
}
```

#### Usage Example

See `ToolboxAccordion.example.tsx` for a complete working example.

```tsx
import { ToolboxAccordion } from "@/components/query/ToolboxAccordion";

function MyComponent() {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filters = [
    {
      category: "Age Filters",
      label: "Adults (19+ years)",
      query: 'AND (adult[mh] OR "adult"[tiab])',
      description: "Limit to studies involving adult populations"
    },
    // ... more filters
  ];

  const handleAddFilter = (filter) => {
    setQuery(query + " " + filter.query);
    setActiveFilters([...activeFilters, filter.label]);
  };

  return (
    <ToolboxAccordion
      filters={filters}
      onAddFilter={handleAddFilter}
      onCopyFilter={(q) => console.log("Copied:", q)}
      activeFilters={activeFilters}
    />
  );
}
```

#### Category Icons & Colors

| Category | Icon | Border Color |
|----------|------|--------------|
| Age Filters / Age | Users | Blue (`border-l-blue-500`) |
| Article Type / Article Type Filters | FileText | Green (`border-l-green-500`) |
| Publication Date / Publication Date Filters | Calendar | Purple (`border-l-purple-500`) |
| Language & Availability / Language | Globe | Orange (`border-l-orange-500`) |
| Study Design / Study Design Filters | Beaker | Cyan (`border-l-cyan-500`) |
| Advanced Search Techniques / Advanced | Settings | Pink (`border-l-pink-500`) |

#### Filter States

- **Default**: Gray background with hover effect
- **Active**: Primary color background with "Active" badge, "Add" button disabled
- **Copied**: "Copy" button text changes to "Copied!" for 2 seconds

#### Styling

The component uses:
- Shadcn UI components: Card, Button, Badge, Accordion
- Tailwind CSS utility classes
- Lucide React icons
- Custom color coding per category

#### Accessibility

- Keyboard navigation supported via Radix UI Accordion
- Focus states for all interactive elements
- Semantic HTML structure
- ARIA attributes from Radix UI primitives

---

### StrategyCard

Displays a single generated query strategy with metadata and actions.

See `StrategyCard.tsx` for implementation details.

---

### ResultsPagination

Pagination component for query results.

See `ResultsPagination.tsx` for implementation details.

---

## Dependencies

All components rely on:
- **@radix-ui/react-accordion**: v1.2.12+ (for ToolboxAccordion)
- **lucide-react**: v0.309.0+ (icons)
- **tailwindcss**: v3.4.1+ (styling)
- **class-variance-authority**: v0.7.0+ (variant utilities)

## Installation

If you need to add the accordion component to a new project:

```bash
npm install @radix-ui/react-accordion
```

Then copy:
1. `components/ui/accordion.tsx` - Base accordion component
2. `components/query/ToolboxAccordion.tsx` - Filters toolbox component

Ensure your `tailwind.config.ts` includes the accordion animations:

```typescript
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
},
```
