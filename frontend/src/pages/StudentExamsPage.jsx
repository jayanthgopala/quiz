import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

function getExamStatus(exam) {
  const now = Date.now();
  const start = new Date(exam.startTime).getTime();
  const end = new Date(exam.endTime).getTime();
  if (now < start) return "UPCOMING";
  if (now > end) return "ENDED";
  return "LIVE";
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/exams");
      setExams(data.exams || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [exams]
  );

  return (
    <DashboardShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Exams</h2>
        <button
          type="button"
          className="rounded bg-slate-200 px-3 py-2 text-sm"
          onClick={load}
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-slate-600">Loading exams...</p> : null}
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {!loading && sortedExams.length === 0 ? (
          <p className="rounded bg-slate-50 p-4 text-slate-600">No exams found.</p>
        ) : null}

        {sortedExams.map((exam) => {
          const status = getExamStatus(exam);
          return (
            <article key={exam._id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{exam.title}</h3>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    status === "LIVE"
                      ? "bg-green-100 text-green-700"
                      : status === "UPCOMING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-sm text-slate-600">Batch: {exam.assignedBatch}</p>
              <p className="text-sm text-slate-600">Duration: {exam.duration} mins</p>
              <p className="text-sm text-slate-600">Attempts: {exam.attemptLimit}</p>
              <p className="text-sm text-slate-600">Starts: {formatDateTime(exam.startTime)}</p>
              <p className="text-sm text-slate-600">Ends: {formatDateTime(exam.endTime)}</p>
              <button
                type="button"
                className="mt-4 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={status !== "LIVE"}
                onClick={() => navigate(`/student/exams/${exam._id}/attempt`)}
              >
                {status === "LIVE" ? "Start / Resume" : "Unavailable"}
              </button>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
