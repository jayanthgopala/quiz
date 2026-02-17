import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseQuestionIds(raw) {
  const tokens = raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(tokens));
}

function isObjectId(value) {
  return /^[a-f\d]{24}$/i.test(value);
}

export default function ProfessorCreateExamPage() {
  const [form, setForm] = useState({
    title: "",
    questionIdsRaw: "",
    duration: "60",
    startTime: "",
    endTime: "",
    assignedBatch: "",
    attemptLimit: "1",
    randomizeQuestions: true,
    shuffleOptions: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdExam, setCreatedExam] = useState(null);

  const parsedQuestionIds = useMemo(() => parseQuestionIds(form.questionIdsRaw), [form.questionIdsRaw]);
  const invalidQuestionIds = parsedQuestionIds.filter((id) => !isObjectId(id));

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCreatedExam(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (parsedQuestionIds.length === 0) {
      setError("At least one question ID is required.");
      return;
    }
    if (invalidQuestionIds.length > 0) {
      setError("One or more question IDs are invalid ObjectIds.");
      return;
    }

    const startIso = toIsoOrNull(form.startTime);
    const endIso = toIsoOrNull(form.endTime);
    if (!startIso || !endIso) {
      setError("Start time and end time are required.");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        questions: parsedQuestionIds,
        duration: Number(form.duration),
        startTime: startIso,
        endTime: endIso,
        assignedBatch: form.assignedBatch.trim() || "ALL",
        attemptLimit: Number(form.attemptLimit),
        randomizeQuestions: form.randomizeQuestions,
        shuffleOptions: form.shuffleOptions
      };

      const { data } = await api.post("/exams", payload);
      setCreatedExam(data);
      setForm((prev) => ({
        ...prev,
        title: "",
        questionIdsRaw: "",
        startTime: "",
        endTime: ""
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create exam.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Create Exam</h2>
        <Link to="/" className="rounded bg-slate-200 px-3 py-2 text-sm">
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Exam Title</span>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Placement Mock Test - Aptitude"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Assigned Batch / Department</span>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.assignedBatch}
            onChange={(e) => setField("assignedBatch", e.target.value)}
            placeholder="CSE (leave empty for ALL)"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Duration (minutes)</span>
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.duration}
            min={1}
            max={600}
            onChange={(e) => setField("duration", e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Attempt Limit</span>
          <input
            type="number"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.attemptLimit}
            min={1}
            max={10}
            onChange={(e) => setField("attemptLimit", e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Start Time</span>
          <input
            type="datetime-local"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">End Time</span>
          <input
            type="datetime-local"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.endTime}
            onChange={(e) => setField("endTime", e.target.value)}
            required
          />
        </label>

        <div className="lg:col-span-2">
          <span className="mb-1 block text-sm font-medium">Question IDs</span>
          <textarea
            rows={6}
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={form.questionIdsRaw}
            onChange={(e) => setField("questionIdsRaw", e.target.value)}
            placeholder="Enter ObjectIds separated by comma, space, or newline"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Parsed IDs: {parsedQuestionIds.length}
            {invalidQuestionIds.length > 0 ? ` | Invalid: ${invalidQuestionIds.length}` : ""}
          </p>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.randomizeQuestions}
            onChange={(e) => setField("randomizeQuestions", e.target.checked)}
          />
          <span className="text-sm">Randomize question order</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.shuffleOptions}
            onChange={(e) => setField("shuffleOptions", e.target.checked)}
          />
          <span className="text-sm">Shuffle options</span>
        </label>

        <div className="lg:col-span-2 flex items-center justify-end">
          <button
            type="submit"
            className="rounded bg-brand-500 px-5 py-2 text-white disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Exam"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}

      {createdExam ? (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="font-medium">Exam created successfully.</p>
          <p className="text-sm">Exam ID: {createdExam._id}</p>
          <p className="text-sm">Title: {createdExam.title}</p>
        </div>
      ) : null}
    </DashboardShell>
  );
}
