import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-200 to-brand-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Sign in</h1>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm">Password</span>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button
          className="w-full rounded bg-brand-500 px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
