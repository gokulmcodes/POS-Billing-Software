import { BookOpen, ChevronRight, Grid2x2, Monitor, ShoppingCart, Tags, Truck, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";

const links = [
  { to: "/mobile/categories", label: "Categories", icon: Tags, hint: "Product grouping" },
  { to: "/mobile/suppliers", label: "Suppliers", icon: Truck, hint: "Vendors" },
  { to: "/mobile/purchases", label: "Purchases", icon: ShoppingCart, hint: "Stock intake" },
  { to: "/mobile/returns", label: "Returns", icon: Undo2, hint: "Refunds & exchanges" },
  { to: "/mobile/transactions", label: "Transactions", icon: Grid2x2, hint: "All bills" },
  { to: "/mobile/ledger", label: "Ledger", icon: BookOpen, hint: "Accounts" },
];

export default function More() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">All admin modules are available in this mobile layout.</p>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <link.icon size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">{link.label}</p>
                <p className="text-xs text-slate-400">{link.hint}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        ))}
        <Link to="/billing" className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <Monitor size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700">Open Billing Portal</p>
              <p className="text-xs text-slate-400">Switch to POS mode</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </Link>
      </div>
    </div>
  );
}
