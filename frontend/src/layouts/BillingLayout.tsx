import { LayoutDashboard, LogOut, Receipt, ScanLine } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { cn } from "../components/ui";

const tabs = [
  { to: "/billing", end: true, label: "New Sale", icon: ScanLine },
  { to: "/billing/history", label: "History", icon: Receipt },
];

export function BillingLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 text-white md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-sm font-bold">PS</div>
          <div>
            <p className="text-sm font-semibold">Billing Portal</p>
            <p className="text-xs text-slate-400">{user?.name} · {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
              onClick={() => navigate("/admin")}
            >
              <LayoutDashboard size={14} /> Admin
            </button>
          )}
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 md:px-6">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
                isActive ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700",
              )
            }
          >
            <tab.icon size={16} /> {tab.label}
          </NavLink>
        ))}
      </div>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
