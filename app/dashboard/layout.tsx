'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  FileCode, 
  BarChart3, 
  FileText, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  User, 
  Menu, 
  Search, 
  Key, 
  Zap, 
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Tailwind v4's utilities (bg-primary, text-primary, ...) read --color-primary
// at runtime, so overriding it on the root element re-themes the whole app
// without a rebuild.
function darkenHex(hex: string, amount = 0.15): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex;
  const num = parseInt(clean, 16);
  const channel = (shift: number) =>
    Math.max(0, Math.floor(((num >> shift) & 0xff) * (1 - amount)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, username, role, tenant, tenantName, loginTenant, logout, changeTenant, loading } = useSession();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionTimeoutActive, setSessionTimeoutActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Simulation Campaign 'Q2 Assessment' is running.", time: '5 mins ago', read: false },
    { id: 2, text: 'Microsoft Entra ID configurations rotated.', time: '1 hour ago', read: false },
    { id: 3, text: 'New phishing template package loaded.', time: '1 day ago', read: true }
  ]);

  const [adminTenants, setAdminTenants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (loginTenant === 'default') {
      api.admin.tenants.list()
        .then(data => {
          setAdminTenants(data.map((t: any) => ({ id: t.id, name: t.name })));
        })
        .catch(() => {
          setAdminTenants([
            { id: 'default', name: 'Default Tenant' },
            { id: 'provana', name: 'Provana Corp' },
            { id: 'hero', name: 'Hero Logistics' }
          ]);
        });
    }
  }, [loginTenant]);

  // Auth Guard
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/auth/login');
    }
  }, [isLoggedIn, loading, router]);

  // Verify the stored session is still valid against the backend, rather than
  // trusting localStorage alone — a stale/fake token would otherwise render
  // this dashboard shell while every data call underneath silently 401s.
  useEffect(() => {
    if (loading || !isLoggedIn) return;
    api.auth.me().catch(() => {
      logout();
    });
  }, [isLoggedIn, loading]);

  // Apply the tenant's branding accent color across the dashboard.
  useEffect(() => {
    if (loading || !isLoggedIn) return;
    api.settings.get()
      .then((settings) => {
        const color = settings.branding?.primaryColor;
        if (color) {
          document.documentElement.style.setProperty('--color-primary', color);
          document.documentElement.style.setProperty('--color-primary-hover', darkenHex(color));
        }
      })
      .catch(() => {
        // Tenant settings unreachable — keep the default theme.
      });
  }, [isLoggedIn, loading]);

  // Command palette listener (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dropdowns click-away listener
  useEffect(() => {
    const handleDocumentClick = () => {
      setNotificationsOpen(false);
      setProfileMenuOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-medium text-slate-600">Loading console...</span>
        </div>
      </div>
    );
  }

  // Sidebar Links
  const baseMenuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaign Manager', href: '/dashboard/campaigns', icon: Send },
    { name: 'Employee Directory', href: '/dashboard/employees', icon: Users },
    { name: 'Phishing Templates', href: '/dashboard/templates', icon: FileCode },
    { name: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Audit Activity Logs', href: '/dashboard/audit-logs', icon: FileText },
  ];

  const menuItems = [...baseMenuItems];
  if (loginTenant === 'default') {
    menuItems.push({ name: 'Super Admin Console', href: '/dashboard/super-admin', icon: ShieldCheck });
  }

  const settingItems = [
    { name: 'Tenant Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Roles & Permissions', href: '/dashboard/settings/roles', icon: Key },
    { name: 'Profile Settings', href: '/dashboard/settings/profile', icon: User },
    { name: 'Help Center', href: '/dashboard/help', icon: HelpCircle },
  ];

  // Helper to mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Session Expiring Banner */}
      {sessionTimeoutActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>Security Alert: Your administrative session will expire in 2 minutes due to inactivity.</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSessionTimeoutActive(false);
                toast.success('Session extended successfully. Security token refreshed.');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-sm cursor-pointer"
            >
              Renew Session
            </button>
            <button 
              onClick={() => setSessionTimeoutActive(false)}
              className="text-amber-700 hover:text-amber-950 font-medium px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-50 shrink-0 fixed md:static inset-y-0 left-0 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-20 overflow-hidden'
        } ${sessionTimeoutActive ? 'pt-12' : 'pt-0'}`}
      >
        <div>
          {/* Logo header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Image src="/workmate-shield-logo.png" alt="Workmate Shield" width={44} height={44} className="h-11 w-11 rounded-md shadow-xs shrink-0" />
              {sidebarOpen && (
                <span className="font-bold text-xs tracking-wider text-slate-900 truncate">
                  WORKMATE <span className="text-primary">SHIELD</span>
                </span>
              )}
            </div>
            {sidebarOpen && (
              <Badge variant="success" className="text-[10px] scale-90">
                Active
              </Badge>
            )}
          </div>

          {/* Tenant Switcher dropdown (Linear style) */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate">{tenantName || 'Default Tenant'}</span>
                </div>
                {sidebarOpen && loginTenant === 'default' && adminTenants.length > 0 && (
                  <select 
                    value={tenant} 
                    onChange={(e) => {
                      const selected = adminTenants.find(t => t.id === e.target.value);
                      changeTenant(e.target.value, selected?.name || '');
                      toast.info(`Switched to tenant workspace: ${selected?.name || e.target.value}`);
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  >
                    {adminTenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom items */}
        <div>
          <div className="p-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-3">
              {sidebarOpen ? 'Administration' : 'Admin'}
            </span>
            <nav className="space-y-1">
              {settingItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.name}</span>}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User profile footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-300">
                {username.substring(0, 2).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-slate-700 truncate">{username}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{role}</span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button 
                onClick={logout} 
                className="text-slate-400 hover:text-destructive p-1 rounded-sm transition-colors cursor-pointer"
                title="Sign out of portal"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mock Command Search triggers command palette */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 text-xs cursor-pointer select-none"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search dashboard actions...</span>
              <kbd className="bg-white border border-slate-300 px-1 rounded-sm text-[10px] font-mono">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Secure status indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Secure Link Active
            </div>

            {/* Notification trigger */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-semibold text-xs text-slate-800">Alert Notifications</span>
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        toast.success('All notifications marked as read.');
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          notif.read ? 'bg-slate-50' : 'bg-amber-50/50 hover:bg-amber-50'
                        }`}
                      >
                        <p className="text-slate-700">{notif.text}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin actions dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                  {username.substring(0,2).toUpperCase()}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 font-semibold text-slate-700">
                    {username}
                  </div>
                  <a href="/settings/profile" className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50">
                    <User className="h-3.5 w-3.5" /> My Profile
                  </a>
                  <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50">
                    <Settings className="h-3.5 w-3.5" /> Tenant Settings
                  </a>
                  <button 
                    onClick={logout} 
                    className="flex w-full items-center gap-2 px-3 py-2 text-destructive hover:bg-slate-50 text-left border-t border-slate-100"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className={`flex-1 p-6 overflow-y-auto ${sessionTimeoutActive ? 'mt-12' : 'mt-0'}`}>
          {children}
        </main>
      </div>

      {/* Command Palette Modal (⌘K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search command actions (e.g. error, test, simulation)..." 
                className="w-full text-sm outline-hidden text-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-sm"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                Simulated Sandbox Errors & Banner Triggers
              </div>

              <button 
                onClick={() => {
                  setCommandPaletteOpen(false);
                  setSessionTimeoutActive(true);
                  toast.warning('Session timeout warning banner displayed.');
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-600"
              >
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Trigger Session Expiration Banner (Security warning UX)
              </button>

              <button 
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push('/unauthorized');
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-600"
              >
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Trigger mock 404 / 500 error screen state
              </button>

              <button 
                onClick={() => {
                  setCommandPaletteOpen(false);
                  toast.error('API Rate Limit Exceeded: Please wait 60 seconds before resending bulk emails.', {
                    duration: 5000,
                  });
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-600"
              >
                <Zap className="h-4 w-4 text-orange-500" />
                Trigger simulated API rate limit toast
              </button>

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-2">
                Quick Navigation Shortcuts
              </div>

              <button 
                onClick={() => { setCommandPaletteOpen(false); router.push('/dashboard/campaigns'); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-600"
              >
                <Send className="h-4 w-4 text-slate-400" />
                Go to Campaign Manager
              </button>

              <button 
                onClick={() => { setCommandPaletteOpen(false); router.push('/dashboard/employees'); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 text-slate-600"
              >
                <Users className="h-4 w-4 text-slate-400" />
                Go to Employee Directory
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatbotWidget />

    </div>
  );
}
