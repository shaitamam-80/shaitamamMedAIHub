import AppSidebar from '@/components/layout/AppSidebar';
import TopBar from '@/components/layout/TopBar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* Main content area */}
      <SidebarInset>
        <TopBar />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>

      {/* Sidebar (left side in LTR) */}
      <AppSidebar />
    </SidebarProvider>
  );
}
