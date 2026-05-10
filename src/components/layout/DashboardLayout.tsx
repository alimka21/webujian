import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, LayoutDashboard, Users, BookOpen, Clock, FileText, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { cn } from "../../lib/utils";

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "TEACHER", "STUDENT"] },
    { name: "Ujian Online", href: "/dashboard/exams", icon: FileText, roles: ["SUPER_ADMIN", "TEACHER", "STUDENT"] },
    { name: "Presensi", href: "/dashboard/attendance", icon: Clock, roles: ["SUPER_ADMIN", "TEACHER"] },
    { name: "Tracer Alumni", href: "/dashboard/alumni", icon: BookOpen, roles: ["SUPER_ADMIN"] },
  ];

  const managementItems = [
    { name: "CMS Berita", href: "/dashboard/cms", icon: FileText, roles: ["SUPER_ADMIN"] },
    { name: "Data Siswa & Kelas", href: "/dashboard/students", icon: Users, roles: ["SUPER_ADMIN", "TEACHER"] },
  ];

  const allowedMenus = menuItems.filter(m => user && m.roles.includes(user.role));
  const allowedManagement = managementItems.filter(m => user && m.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">EduPortal<span className="text-blue-400">Pro</span></span>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col overflow-y-auto">
          <div className="px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
          {allowedMenus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white border-r-4 border-blue-500" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "opacity-100" : "opacity-80")} />
                {item.name}
              </Link>
            )
          })}

          {allowedManagement.length > 0 && (
            <>
              <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Management</div>
              {allowedManagement.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 transition-colors",
                      isActive 
                        ? "bg-slate-800 text-white border-r-4 border-blue-500" 
                        : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "opacity-100" : "opacity-80")} />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="p-4 bg-slate-800/50 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center font-bold text-white">
                {user?.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-md"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">Dashboard Area</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 italic">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Sistem Online: SMA Bintang Pelajar
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto flex flex-col gap-8">
          <Outlet />
        </div>
        
        {/* Footer Status */}
        <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center px-8 text-[11px] text-slate-500 justify-between shrink-0">
          <div className="flex gap-4">
            <span>DB Status: <span className="text-green-600 font-bold">Connected</span></span>
            <span>Version: v2.4.0-pro</span>
          </div>
          <div>© 2024 Senior Architect Design System • SMA Bintang Pelajar</div>
        </footer>
      </main>
    </div>
  );
}
