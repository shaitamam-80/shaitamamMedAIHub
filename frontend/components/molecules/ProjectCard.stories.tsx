import type { Meta, StoryObj } from "@storybook/react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/api";

/**
 * ProjectCard displays a research project with its framework type,
 * status, and key metadata. Used in the Projects page grid.
 */
const meta: Meta<typeof ProjectCard> = {
  title: "Molecules/ProjectCard",
  component: ProjectCard,
  tags: ["autodocs"],
  argTypes: {
    showStatus: {
      control: "boolean",
      description: "Show project status indicator",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card component for displaying project information with framework-specific color coding and status indicators.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

// Sample project data
const baseProject: Project = {
  id: "1",
  name: "Diabetes Treatment Meta-Analysis",
  description: "Systematic review of diabetes treatment outcomes in elderly patients",
  framework_type: "PICO",
  framework_data: {
    P: "Elderly patients with Type 2 Diabetes",
    I: "GLP-1 receptor agonists",
    C: "Standard metformin therapy",
    O: "HbA1c reduction and cardiovascular outcomes",
  },
  user_id: "user-1",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T14:30:00Z",
};

// Different framework types
export const PICOFramework: Story = {
  args: {
    project: baseProject,
  },
};

export const SPIDERFramework: Story = {
  args: {
    project: {
      ...baseProject,
      id: "2",
      name: "Patient Experience Qualitative Study",
      framework_type: "SPIDER",
      framework_data: {
        S: "Cancer survivors",
        PI: "Coping mechanisms",
        D: "Semi-structured interviews",
        E: "Thematic analysis",
        R: "Quality of life themes",
      },
    },
  },
};

export const PEOFramework: Story = {
  args: {
    project: {
      ...baseProject,
      id: "3",
      name: "Workplace Intervention Study",
      framework_type: "PEO",
      framework_data: {
        P: "Office workers with sedentary jobs",
        E: "Standing desk intervention",
        O: "Musculoskeletal health outcomes",
      },
    },
  },
};

export const CoCoPoPFramework: Story = {
  args: {
    project: {
      ...baseProject,
      id: "4",
      name: "Diagnostic Accuracy Review",
      framework_type: "CoCoPop",
      framework_data: {
        Co: "Primary care setting",
        Co2: "Chest X-ray screening",
        Pop: "Adults over 50",
      },
    },
  },
};

// Status variations
export const ReadyStatus: Story = {
  args: {
    project: baseProject,
    showStatus: true,
  },
};

export const InProgressStatus: Story = {
  args: {
    project: {
      ...baseProject,
      framework_data: {
        P: "Elderly patients",
        I: "Exercise therapy",
      },
    },
    showStatus: true,
  },
};

export const DraftStatus: Story = {
  args: {
    project: {
      ...baseProject,
      framework_data: {},
    },
    showStatus: true,
  },
};

// Without status indicator
export const NoStatusIndicator: Story = {
  args: {
    project: baseProject,
    showStatus: false,
  },
};

// With delete handler
export const WithDeleteAction: Story = {
  args: {
    project: baseProject,
    onDelete: (project) => {
      console.log("Delete requested for:", project.name);
    },
  },
};

// Grid layout demonstration
export const ProjectGrid: Story = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ProjectCard
        project={baseProject}
        onDelete={(p) => console.log("Delete:", p.name)}
      />
      <ProjectCard
        project={{
          ...baseProject,
          id: "2",
          name: "Qualitative Experience Study",
          framework_type: "SPIDER",
          framework_data: {
            S: "Healthcare workers",
            PI: "Burnout experiences",
          },
        }}
        onDelete={(p) => console.log("Delete:", p.name)}
      />
      <ProjectCard
        project={{
          ...baseProject,
          id: "3",
          name: "Environmental Exposure Review",
          framework_type: "PEO",
          framework_data: {
            P: "Urban residents",
            E: "Air pollution",
            O: "Respiratory outcomes",
          },
        }}
        onDelete={(p) => console.log("Delete:", p.name)}
      />
    </div>
  ),
};
