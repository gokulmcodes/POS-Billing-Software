import {
  BarChart3,
  Grid2x2,
  Home,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { cn } from "../components/ui";

const bottomNav = [
  { to: "/mobile", end: true, label: "Home", icon: Home },
  { to: "/mobile/products", label: "Products", icon: Package },
  { to: "/mobile/reports", label: "Reports", icon: BarChart3 },
  { to: "/mobile/staff", label: "Staff", icon: Users },
  { to: "/mobile/more", label: "More", icon: Grid2x2 },
];

const titles: Record<string, string> = {
  "/mobile": "Dashboard",
  "/mobile/products": "Products",
  "/mobile/categories": "Categories",
  "/mobile/staff": "Staff",
  "/mobile/suppliers": "Suppliers",
  "/mobile/purchases": "Purchases",
  "/mobile/returns": "Returns",
  "/mobile/transactions": "Transactions",
  "/mobile/ledger": "Ledger",
  "/mobile/reports": "Reports",
  "/mobile/more": "More",
};

export function MobileAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = titles[location.pathname] ?? "Admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 sm:p-6">
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-100 sm:h-[860px] sm:max-w-[420px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-slate-950 sm:shadow-2xl">
        <div className="hidden items-center justify-between bg-slate-950 px-6 pt-2 pb-1 text-[11px] text-slate-300 sm:flex">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> POS
          </span>
        </div>

        <header className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
          <div>
            <p className="text-xs text-indigo-200">Admin · {user?.role}</p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-semibold">
              {user?.name?.charAt(0) ?? "A"}
            </div>
            <button
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Sign out"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

        <nav className="flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition",
                  isActive ? "text-indigo-600" : "text-slate-400",
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
