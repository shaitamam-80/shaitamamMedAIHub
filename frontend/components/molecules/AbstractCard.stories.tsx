import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AbstractCard } from "./AbstractCard";
import type { AbstractResponse } from "@/lib/api";

/**
 * AbstractCard displays a research article abstract for screening.
 * Features collapsible content, AI reasoning, and decision buttons.
 */
const meta: Meta<typeof AbstractCard> = {
  title: "Molecules/AbstractCard",
  component: AbstractCard,
  tags: ["autodocs"],
  argTypes: {
    isExpanded: {
      control: "boolean",
      description: "Whether the abstract is expanded",
    },
    showActions: {
      control: "boolean",
      description: "Show include/exclude/maybe buttons",
    },
    isProcessing: {
      control: "boolean",
      description: "Loading state during decision update",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card for displaying and screening research abstracts. Shows article metadata, AI analysis, and supports user decisions.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AbstractCard>;

// Sample abstract data
const baseAbstract: AbstractResponse = {
  id: "abstract-1",
  pmid: "12345678",
  title: "Effect of High-Intensity Interval Training on Glycemic Control in Type 2 Diabetes: A Randomized Controlled Trial",
  abstract_text: "Background: High-intensity interval training (HIIT) has shown promise in improving metabolic health. This study aimed to evaluate the effects of HIIT compared to moderate-intensity continuous training (MICT) on glycemic control in patients with type 2 diabetes mellitus.\n\nMethods: A 12-week randomized controlled trial was conducted with 120 adults with type 2 diabetes. Participants were randomly assigned to HIIT (n=60) or MICT (n=60) groups. Primary outcome was change in HbA1c levels.\n\nResults: The HIIT group showed significantly greater reduction in HbA1c (-1.2% vs -0.7%, p<0.001) compared to MICT. Secondary outcomes including fasting glucose and insulin sensitivity also improved more in the HIIT group.\n\nConclusion: HIIT is more effective than MICT in improving glycemic control in type 2 diabetes patients and may be considered as an alternative exercise prescription.",
  authors: "Smith J, Johnson A, Williams B, Brown C, Davis E",
  journal: "Diabetes Care",
  publication_date: "2024-01-15",
  keywords: ["diabetes", "exercise", "HIIT", "glycemic control", "RCT"],
  status: "pending",
  ai_reasoning: "This study directly addresses the PICO framework: Population (Type 2 diabetes patients), Intervention (HIIT), Comparison (MICT), and Outcome (glycemic control). The RCT design with 120 participants provides strong evidence. Recommend INCLUDE based on high relevance to the research question.",
  file_id: "file-1",
  created_at: "2024-01-15T10:00:00Z",
};

// Wrapper component for interactive stories
const InteractiveWrapper = ({ abstract, initialExpanded = false, ...props }: { abstract: AbstractResponse; showActions?: boolean; initialExpanded?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [currentAbstract, setCurrentAbstract] = useState(abstract);

  const handleDecision = (id: string, decision: "include" | "exclude" | "maybe") => {
    setCurrentAbstract({ ...currentAbstract, status: decision });
    console.log(`Decision for ${id}: ${decision}`);
  };

  return (
    <AbstractCard
      abstract={currentAbstract}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      onDecision={handleDecision}
      {...props}
    />
  );
};

// Default states
export const Pending: Story = {
  render: () => <InteractiveWrapper abstract={baseAbstract} />,
};

export const Included: Story = {
  render: () => (
    <InteractiveWrapper abstract={{ ...baseAbstract, status: "include" }} />
  ),
};

export const Excluded: Story = {
  render: () => (
    <InteractiveWrapper abstract={{ ...baseAbstract, status: "exclude" }} />
  ),
};

export const Maybe: Story = {
  render: () => (
    <InteractiveWrapper abstract={{ ...baseAbstract, status: "maybe" }} />
  ),
};

// Note: "analyzing" status is handled by isProcessing prop, not status field
export const AnalyzingState: Story = {
  render: () => (
    <InteractiveWrapper abstract={{ ...baseAbstract, status: "pending" }} />
  ),
};

// Expanded state
export const Expanded: Story = {
  render: () => <InteractiveWrapper abstract={baseAbstract} initialExpanded />,
};

// Without actions (read-only mode)
export const ReadOnly: Story = {
  render: () => (
    <InteractiveWrapper
      abstract={{ ...baseAbstract, status: "include" }}
      showActions={false}
    />
  ),
};

// With user notes
export const WithUserNotes: Story = {
  render: () => (
    <InteractiveWrapper
      abstract={{
        ...baseAbstract,
        status: "maybe",
        user_notes: "Need to check if sample size is adequate for subgroup analysis. Discuss with team.",
      }}
    />
  ),
};

// Without abstract text
export const NoAbstractText: Story = {
  render: () => (
    <InteractiveWrapper
      abstract={{
        ...baseAbstract,
        abstract_text: "",
      }}
    />
  ),
};

// Without AI reasoning
export const NoAIReasoning: Story = {
  render: () => (
    <InteractiveWrapper
      abstract={{
        ...baseAbstract,
        ai_reasoning: undefined,
      }}
    />
  ),
};

// Processing state
export const Processing: Story = {
  args: {
    abstract: baseAbstract,
    isExpanded: false,
    isProcessing: true,
    onToggle: () => {},
    onDecision: () => {},
  },
};

// Multiple cards demonstration
export const AbstractList: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-3xl">
      <InteractiveWrapper abstract={{ ...baseAbstract, status: "include" }} />
      <InteractiveWrapper
        abstract={{
          ...baseAbstract,
          id: "abstract-2",
          pmid: "87654321",
          title: "Comparative Effectiveness of Pharmacological Interventions for Type 2 Diabetes: A Network Meta-Analysis",
          status: "exclude",
          ai_reasoning: "This is a network meta-analysis, not an RCT. May be useful for background but does not meet primary inclusion criteria.",
        }}
      />
      <InteractiveWrapper
        abstract={{
          ...baseAbstract,
          id: "abstract-3",
          pmid: "11223344",
          title: "Long-term Outcomes of Exercise Interventions in Prediabetes: A Systematic Review",
          status: "maybe",
          ai_reasoning: "Focuses on prediabetes rather than established T2DM. Population may partially overlap. Recommend further review.",
        }}
      />
    </div>
  ),
};
