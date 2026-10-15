import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  Receipt,
  ShoppingCart,
  Smartphone,
  Tags,
  Truck,
  Undo2,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { cn } from "../components/ui";

const nav = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/staff", label: "Staff", icon: Users },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/admin/returns", label: "Returns", icon: Undo2 },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/ledger", label: "Ledger", icon: BookOpen },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">PS</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">POS Billing</p>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-700">{user?.name}</p>
            <p className="text-xs capitalize text-slate-400">{user?.role}</p>
          </div>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-800">Admin Portal</p>
            <p className="hidden text-xs text-slate-400 sm:block">Manage products, staff, suppliers, billing and reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 md:inline-flex"
              onClick={() => navigate("/mobile")}
            >
              <Smartphone size={14} /> Mobile UI
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              onClick={() => navigate("/billing")}
            >
              <Monitor size={14} /> Billing
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
