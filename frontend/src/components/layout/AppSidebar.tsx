'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FolderOpen, Wrench, Settings, ChevronDown, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  {
    label: 'לוח בקרה',
    href: '/',
    icon: Home,
  },
  {
    label: 'הפרויקטים שלי',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    label: 'כלים',
    icon: Wrench,
    submenu: [
      { label: 'Article Appraisal', href: '/tools/article-appraisal' },
      { label: 'Find Journal', href: '/tools/find-journal' },
    ],
  },
  {
    label: 'הגדרות',
    href: '/settings',
    icon: Settings,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; fullName?: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
        });
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
    }
    return <User className="w-5 h-5" />;
  };

  return (
    <aside className="w-[280px] bg-white border-l border-[#e2e8f0] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#e2e8f0]">
        <Link href="/" className="block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            MedAI Hub
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">AI-Powered Medical Research</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          if (item.submenu) {
            return (
              <div key={index}>
                <button
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-all',
                    pathname.startsWith('/tools') && 'bg-[#f1f5f9] text-[#0f172a]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      toolsOpen && 'rotate-180'
                    )}
                  />
                </button>
                {toolsOpen && (
                  <div className="mr-4 mt-1 space-y-1">
                    {item.submenu.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={cn(
                          'block px-4 py-2 rounded-lg text-sm transition-all',
                          isActive(subItem.href)
                            ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-500 border-r-2 border-blue-500'
                            : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <Link
              key={index}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                isActive(item.href!)
                  ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-500 border-r-2 border-blue-500'
                  : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#e2e8f0]">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#0f172a] truncate">
              {user?.fullName || 'משתמש'}
            </div>
            <div className="text-xs text-[#94a3b8] truncate">
              {user?.email || ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
            title="התנתקות"
          >
            <LogOut className="w-4 h-4 text-[#94a3b8]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
