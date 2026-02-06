import ProjectSidebar from '@/components/project/ProjectSidebar';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex h-full">
      {/* Project Sidebar (right side in RTL) */}
      <ProjectSidebar projectId={projectId} />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
