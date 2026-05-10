import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Menu, X, LayoutDashboard, Users, FileText, 
  GraduationCap, ClipboardList, PenTool, BarChart3, Newspaper, CalendarCheck
} from 'lucide-react';
import { useAuthStore, Role } from '../../store/authStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navConfig: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Pengguna', href: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Alumni', href: '/dashboard/admin/alumni', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'Berita / CMS', href: '/dashboard/admin/cms', icon: <Newspaper className="w-5 h-5" /> },
    { label: 'Statistik', href: '/dashboard/admin/stats', icon: <BarChart3 className="w-5 h-5" /> },
  ],
  GURU: [
    { label: 'Dashboard', href: '/dashboard/guru', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Ujian Saya', href: '/dashboard/guru/ujian', icon: <FileText className="w-5 h-5" /> }, // Kita anggap riwayat ujian ada di sini
    { label: 'Buat Ujian', href: '/dashboard/guru/ujian/baru', icon: <PenTool className="w-5 h-5" /> },
    { label: 'Siswa & Kelas', href: '/dashboard/guru/siswa', icon: <Users className="w-5 h-5" /> },
    { label: 'Presensi', href: '/dashboard/guru/presensi', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'Rekap Nilai', href: '/dashboard/guru/rekap', icon: <ClipboardList className="w-5 h-5" /> },
  ],
  SISWA: [
    { label: 'Dashboard', href: '/dashboard/siswa', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Ujian Aktif', href: '/dashboard/siswa/ujian', icon: <FileText className="w-5 h-5" /> },
    { label: 'Riwayat Nilai', href: '/dashboard/siswa/riwayat', icon: <ClipboardList className="w-5 h-5" /> },
  ],
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user ? navConfig[user.role] : [];
  
  // Jika path default cuma /dashboard/admin, NavLink '/dashboard/admin' akan selalu aktif untuk semua subpath kalau end=true nya tidak dipassing dengan benar
  // Kita custom fungsi active
  const isActiveRoute = (path: string) => {
    if (path.split('/').length > 3) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950/50">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            <span>EduGenZ</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="p-4 mb-4 mt-2">
          <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 shadow-inner">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Masuk Sebagai</p>
            <p className="font-semibold text-white truncate" title={user?.profile?.nama || user?.email}>
              {user?.profile?.nama || user?.email}
            </p>
            <Badge variant="secondary" className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
              {user?.role}
            </Badge>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActiveRoute(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shadow-sm z-10">
          <button 
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">{user?.profile?.nama || user?.email}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                {(user?.profile?.nama?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
