import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardShell>
      <h2 className="mb-3 text-2xl font-semibold">Welcome, {user?.name}</h2>
      <p className="text-slate-600">
        Role-aware dashboard shell is ready. Next modules: Question Bank, Exams, Anti-Cheating,
        VTU Credit Reports, and Analytics.
      </p>
      {user?.role === "Student" ? (
        <Link
          to="/student/exams"
          className="mt-4 inline-block rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          Go to My Exams
        </Link>
      ) : null}
      {user?.role === "Professor" || user?.role === "Admin" ? (
        <Link
          to="/professor/exams/create"
          className="ml-3 mt-4 inline-block rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          Create New Exam
        </Link>
      ) : null}
    </DashboardShell>
  );
}
