import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

function toSeconds(deadlineAt) {
  return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function normalizeAnswers(answerMap) {
  return Object.entries(answerMap).map(([questionId, answer]) => ({ questionId, answer }));
}

export default function StudentExamAttemptPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [deadlineAt, setDeadlineAt] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [violationFlags, setViolationFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const timeoutTriggeredRef = useRef(false);
  const timeoutSubmittedRef = useRef(false);

  useEffect(() => {
    async function startOrResume() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.post(`/exams/${examId}/start`);
        setAttemptId(data.attemptId);
        setSessionToken(data.sessionToken);
        setQuestions(data.questions || []);
        setDeadlineAt(data.deadlineAt);
        setTimeLeft(toSeconds(data.deadlineAt));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to start exam");
      } finally {
        setLoading(false);
      }
    }
    startOrResume();
  }, [examId]);

  useEffect(() => {
    if (!deadlineAt || result) return undefined;

    const id = window.setInterval(() => {
      const seconds = toSeconds(deadlineAt);
      setTimeLeft(seconds);
      if (seconds <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [deadlineAt, result]);

  useEffect(() => {
    async function sendTimeout() {
      if (!timeoutTriggeredRef.current || timeoutSubmittedRef.current || !attemptId || !sessionToken || result) {
        return;
      }
      try {
        timeoutSubmittedRef.current = true;
        setSubmitting(true);
        const { data } = await api.post(`/exams/${examId}/timeout`, {
          attemptId,
          sessionToken,
          answers: normalizeAnswers(answers),
          violationFlags
        });
        setResult(data);
      } catch (err) {
        timeoutSubmittedRef.current = false;
        setError(err?.response?.data?.message || "Timeout submission failed");
      } finally {
        setSubmitting(false);
      }
    }
    sendTimeout();
  }, [answers, attemptId, examId, result, sessionToken, violationFlags]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setViolationFlags((prev) => [
          ...prev,
          `TAB_SWITCH:${new Date().toISOString()}`
        ]);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function setSingleAnswer(questionId, answer) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function toggleMultiAnswer(questionId, option) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(option);
      const next = exists ? current.filter((item) => item !== option) : [...current, option];
      return { ...prev, [questionId]: next };
    });
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError("");
      const { data } = await api.post(`/exams/${examId}/submit`, {
        attemptId,
        sessionToken,
        answers: normalizeAnswers(answers),
        violationFlags
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && String(value).trim() !== "";
      }).length,
    [answers]
  );

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Exam Attempt</h2>
        <div className="flex items-center gap-3">
          <span className="rounded bg-slate-100 px-3 py-2 text-sm">
            Time Left: <strong>{formatCountdown(timeLeft)}</strong>
          </span>
          <span className="rounded bg-slate-100 px-3 py-2 text-sm">
            Answered: <strong>{answeredCount}/{questions.length}</strong>
          </span>
        </div>
      </div>

      {loading ? <p className="text-slate-600">Starting exam...</p> : null}
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}

      {result ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-semibold">Attempt Submitted</h3>
          <p className="mt-2 text-sm">Status: <strong>{result.status}</strong></p>
          <p className="text-sm">Score: <strong>{result.score}</strong></p>
          <p className="text-sm">Correct: <strong>{result.correct}</strong> / {result.total}</p>
          <button
            type="button"
            className="mt-4 rounded bg-brand-500 px-4 py-2 text-white"
            onClick={() => navigate("/student/exams")}
          >
            Back to My Exams
          </button>
        </div>
      ) : null}

      {!loading && !result ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <section key={question.questionId} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Question {index + 1}</h3>
                <span className="text-xs text-slate-500">
                  {question.type} | +{question.marks} / -{question.negativeMarks}
                </span>
              </div>

              {question.type === "MCQ" ? (
                <div className="space-y-2">
                  {(question.options || []).map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded bg-slate-50 px-3 py-2">
                      <input
                        type="radio"
                        name={`q-${question.questionId}`}
                        checked={answers[question.questionId] === option}
                        onChange={() => setSingleAnswer(question.questionId, option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {question.type === "MultiSelect" ? (
                <div className="space-y-2">
                  {(question.options || []).map((option) => {
                    const selected = Array.isArray(answers[question.questionId])
                      ? answers[question.questionId].includes(option)
                      : false;
                    return (
                      <label key={option} className="flex items-center gap-2 rounded bg-slate-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMultiAnswer(question.questionId, option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {question.type === "Numerical" ? (
                <input
                  type="number"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={answers[question.questionId] ?? ""}
                  onChange={(e) =>
                    setSingleAnswer(
                      question.questionId,
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              ) : null}

              {question.type === "Coding" || question.type === "Descriptive" ? (
                <textarea
                  rows={8}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={answers[question.questionId] ?? ""}
                  onChange={(e) => setSingleAnswer(question.questionId, e.target.value)}
                />
              ) : null}
            </section>
          ))}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded bg-slate-200 px-4 py-2"
              onClick={() => navigate("/student/exams")}
            >
              Exit
            </button>
            <button
              type="button"
              className="rounded bg-brand-500 px-4 py-2 font-medium text-white disabled:opacity-60"
              disabled={submitting || !attemptId || !sessionToken}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Attempt"}
            </button>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
