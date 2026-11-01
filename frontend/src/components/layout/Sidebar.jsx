import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Box,
  Receipt,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/pos", label: "نقطة البيع", icon: ShoppingCart },
  { to: "/inventory", label: "المخزون", icon: Box },
  { to: "/sales", label: "المبيعات", icon: Receipt },
  { to: "/shifts", label: "الورديات", icon: Clock },
  { to: "/customers", label: "العملاء", icon: Users },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
];

const adminNavItems = [
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const isAdmin = user?.role === "super_admin";

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400">نظام POS</h1>
        <p className="text-slate-400 text-sm mt-1">نقطة البيع المتكاملة</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin &&
          adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-rose-600 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
