import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../api";
import { useAuth } from "../auth";
import { Button, Field, Input } from "../components/ui";

const demoAccounts = [
  { label: "Admin", username: "admin@posshop.com", password: "Admin@123" },
  { label: "Staff", username: "staff@posshop.com", password: "Staff@123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin@posshop.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(username.trim(), password);
      navigate(user.role === "admin" ? "/admin" : "/billing", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-lg font-bold">PS</div>
          <span className="text-lg font-semibold">POS Billing Software</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">Retail & textile billing, made simple.</h1>
          <p className="max-w-md text-slate-400">
            Manage products, staff, suppliers and returns in the Admin Portal. Bill customers and print receipts in the
            Billing Portal. Test the full admin experience in a mobile app layout.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Product &amp; variant management with stock control</li>
            <li>• Fast POS billing with cash / card / UPI / split payments</li>
            <li>• Returns, suppliers, purchases, ledger and reports</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">FastAPI · MongoDB · React · TypeScript</p>
      </div>

      <div className="flex items-center justify-center bg-slate-100 p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-800">Sign in</h2>
            <p className="text-sm text-slate-500">Use your store credentials to continue.</p>
          </div>

          <Field label="Email or username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts</p>
            <div className="flex gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => {
                    setUsername(account.username);
                    setPassword(account.password);
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:bg-white"
                >
                  <span className="block font-semibold text-slate-700">{account.label}</span>
                  <span className="text-slate-400">{account.username}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
