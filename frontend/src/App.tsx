import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, useAuth } from "./auth";
import { AdminLayout } from "./layouts/AdminLayout";
import { BillingLayout } from "./layouts/BillingLayout";
import { MobileAdminLayout } from "./layouts/MobileAdminLayout";
import Login from "./pages/Login";
import BillingHistory from "./pages/billing/BillingHistory";
import POS from "./pages/billing/POS";
import Categories from "./pages/admin/Categories";
import Dashboard from "./pages/admin/Dashboard";
import Ledger from "./pages/admin/Ledger";
import Products from "./pages/admin/Products";
import Purchases from "./pages/admin/Purchases";
import Reports from "./pages/admin/Reports";
import Returns from "./pages/admin/Returns";
import Staff from "./pages/admin/Staff";
import Suppliers from "./pages/admin/Suppliers";
import Transactions from "./pages/admin/Transactions";
import More from "./pages/mobile/More";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/billing"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <RequireAuth roles={["admin"]}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="staff" element={<Staff />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="returns" element={<Returns />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route
        path="/billing"
        element={
          <RequireAuth roles={["admin", "staff"]}>
            <BillingLayout />
          </RequireAuth>
        }
      >
        <Route index element={<POS />} />
        <Route path="history" element={<BillingHistory />} />
      </Route>

      <Route
        path="/mobile"
        element={
          <RequireAuth roles={["admin"]}>
            <MobileAdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="staff" element={<Staff />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="returns" element={<Returns />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="reports" element={<Reports />} />
        <Route path="more" element={<More />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
