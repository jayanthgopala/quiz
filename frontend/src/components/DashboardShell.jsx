import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

const linksByRole = {
  Admin: [{ label: "Dashboard", to: "/" }, { label: "User Management" }, { label: "System Logs" }],
  Principal: [{ label: "Dashboard", to: "/" }, { label: "Department Analytics" }, { label: "VTU Reports" }],
  Professor: [
    { label: "Dashboard", to: "/" },
    { label: "Question Bank" },
    { label: "Create Exam", to: "/professor/exams/create" }
  ],
  StudentProctor: [{ label: "Dashboard", to: "/" }, { label: "Assigned Students" }, { label: "Marks" }],
  Student: [{ label: "Dashboard", to: "/" }, { label: "My Exams", to: "/student/exams" }, { label: "Results" }]
};

export default function DashboardShell({ children }) {
  const { user, logout } = useAuth();
  const links = linksByRole[user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 shadow">
        <h1 className="text-lg font-semibold text-brand-700">Secure Placement & VTU Quiz Platform</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.name} ({user?.role})</span>
          <button className="rounded bg-slate-800 px-3 py-2 text-sm text-white" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 font-medium">Navigation</h2>
          <ul className="space-y-2 text-sm">
            {links.map((item) => {
              if (!item.to) {
                return (
                  <li key={item.label} className="rounded-md bg-slate-50 px-3 py-2 text-slate-500">
                    {item.label}
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 ${
                        isActive ? "bg-brand-500 text-white" : "bg-slate-50 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="rounded-xl bg-white p-6 shadow">{children}</main>
      </div>
    </div>
  );
}
