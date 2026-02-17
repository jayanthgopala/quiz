import crypto from "crypto";
import { Exam } from "../models/Exam.js";
import { Attempt } from "../models/Attempt.js";
import { Question } from "../models/Question.js";
import { Log } from "../models/Log.js";
import { buildSnapshotEntry, scoreAttempt, shuffleArray } from "../utils/examEngine.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function canStudentAccessExam(student, exam) {
  return exam.assignedBatch === "ALL" || student.department === exam.assignedBatch;
}

function buildExamQuestionsSnapshot(exam, questions) {
  const questionDocs = exam.randomizeQuestions ? shuffleArray(questions) : questions;
  return questionDocs.map((q) => buildSnapshotEntry(q, exam.shuffleOptions));
}

function sanitizeQuestionForStudent(snapshotQuestion) {
  return {
    questionId: snapshotQuestion.questionId,
    type: snapshotQuestion.type,
    subject: snapshotQuestion.subject,
    difficulty: snapshotQuestion.difficulty,
    options: snapshotQuestion.options,
    marks: snapshotQuestion.marks,
    negativeMarks: snapshotQuestion.negativeMarks
  };
}

function getAttemptDeadline(exam, startedAt = new Date()) {
  const durationDeadline = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
  return durationDeadline < exam.endTime ? durationDeadline : exam.endTime;
}

async function closeAttemptAsTimeout(attempt, submittedAnswers, ipAddress) {
  const scoring = scoreAttempt(attempt.questionSnapshot, submittedAnswers);
  attempt.answers = submittedAnswers;
  attempt.status = "TIMEOUT";
  attempt.score = scoring.score;
  attempt.endTime = new Date();
  attempt.ipAddress = attempt.ipAddress || ipAddress || "";
  await attempt.save();
  return scoring;
}

export async function createExam(req, res) {
  const { title, questions, duration, startTime, endTime, assignedBatch, attemptLimit } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "Exam must include at least one question" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ message: "Invalid exam schedule" });
  }

  const foundQuestions = await Question.find({ _id: { $in: questions } }).select("_id");
  if (foundQuestions.length !== questions.length) {
    return res.status(400).json({ message: "One or more questions were not found" });
  }

  const created = await Exam.create({
    title,
    createdBy: req.user._id,
    questions,
    duration,
    startTime: start,
    endTime: end,
    assignedBatch,
    attemptLimit: attemptLimit || 1,
    randomizeQuestions: req.body.randomizeQuestions ?? true,
    shuffleOptions: req.body.shuffleOptions ?? true
  });

  await Log.create({
    userId: req.user._id,
    action: "CREATE_EXAM",
    ipAddress: req.ip,
    metadata: { examId: created._id, title: created.title }
  });

  return res.status(201).json(created);
}

export async function listExamsForUser(req, res) {
  const query = {};

  if (req.user.role === "Student") {
    query.endTime = { $gte: new Date() };
    query.$or = [{ assignedBatch: "ALL" }, { assignedBatch: req.user.department }];
  } else if (req.user.role === "Professor") {
    query.createdBy = req.user._id;
  }

  const exams = await Exam.find(query).sort({ startTime: 1 }).select(
    "title duration startTime endTime assignedBatch attemptLimit randomizeQuestions shuffleOptions createdBy"
  );

  return res.json({ exams });
}

export async function getExamDetails(req, res) {
  const exam = await Exam.findById(req.params.examId)
    .populate("createdBy", "name role")
    .populate("questions", "type subject difficulty marks negativeMarks");

  if (!exam) {
    return res.status(404).json({ message: "Exam not found" });
  }

  if (req.user.role === "Student" && !canStudentAccessExam(req.user, exam)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.role === "Professor" && String(exam.createdBy._id) !== String(req.user._id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(exam);
}

export async function startExam(req, res) {
  const exam = await Exam.findById(req.params.examId).populate(
    "questions",
    "type subject difficulty options correctAnswer marks negativeMarks"
  );

  if (!exam) {
    return res.status(404).json({ message: "Exam not found" });
  }

  if (!canStudentAccessExam(req.user, exam)) {
    return res.status(403).json({ message: "You are not assigned to this exam" });
  }

  const now = new Date();
  if (now < exam.startTime || now > exam.endTime) {
    return res.status(400).json({ message: "Exam is not active right now" });
  }

  const attempts = await Attempt.find({ examId: exam._id, studentId: req.user._id })
    .sort({ createdAt: -1 })
    .select("+sessionTokenHash");
  const activeAttempt = attempts.find((attempt) => attempt.status === "IN_PROGRESS");

  if (activeAttempt) {
    if (now > activeAttempt.deadlineAt) {
      await closeAttemptAsTimeout(activeAttempt, activeAttempt.answers || [], req.ip);
    } else if (activeAttempt.ipAddress !== req.ip) {
      return res.status(409).json({ message: "Single device policy violated for this exam" });
    } else {
      const rotatedToken = crypto.randomBytes(32).toString("hex");
      activeAttempt.sessionTokenHash = hashToken(rotatedToken);
      await activeAttempt.save();

      return res.json({
        attemptId: activeAttempt._id,
        sessionToken: rotatedToken,
        deadlineAt: activeAttempt.deadlineAt,
        remainingSeconds: Math.max(1, Math.floor((activeAttempt.deadlineAt - now) / 1000)),
        questions: activeAttempt.questionSnapshot.map(sanitizeQuestionForStudent)
      });
    }
  }

  const attemptsUsed = await Attempt.countDocuments({ examId: exam._id, studentId: req.user._id });
  if (attemptsUsed >= exam.attemptLimit) {
    return res.status(400).json({ message: "Attempt limit reached" });
  }

  const questionSnapshot = buildExamQuestionsSnapshot(exam, exam.questions);
  const token = crypto.randomBytes(32).toString("hex");
  const startedAt = new Date();
  const deadlineAt = getAttemptDeadline(exam, startedAt);

  const attempt = await Attempt.create({
    studentId: req.user._id,
    examId: exam._id,
    answers: [],
    score: 0,
    startTime: startedAt,
    deadlineAt,
    ipAddress: req.ip,
    status: "IN_PROGRESS",
    questionSnapshot,
    sessionTokenHash: hashToken(token)
  });

  await Log.create({
    userId: req.user._id,
    action: "START_EXAM_ATTEMPT",
    ipAddress: req.ip,
    metadata: { examId: exam._id, attemptId: attempt._id }
  });

  return res.status(201).json({
    attemptId: attempt._id,
    sessionToken: token,
    deadlineAt,
    remainingSeconds: Math.max(1, Math.floor((deadlineAt - startedAt) / 1000)),
    questions: questionSnapshot.map(sanitizeQuestionForStudent)
  });
}

export async function submitExam(req, res) {
  const { attemptId, sessionToken, answers, violationFlags } = req.body;
  const attempt = await Attempt.findOne({
    _id: attemptId,
    examId: req.params.examId,
    studentId: req.user._id
  }).select("+sessionTokenHash");

  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(409).json({ message: `Attempt already ${attempt.status}` });
  }

  if (!sessionToken || hashToken(sessionToken) !== attempt.sessionTokenHash) {
    return res.status(401).json({ message: "Invalid exam session token" });
  }

  if (attempt.ipAddress && attempt.ipAddress !== req.ip) {
    return res.status(409).json({ message: "Single device policy violated for this exam" });
  }

  const now = new Date();
  const isExpired = now > attempt.deadlineAt;
  const scoring = scoreAttempt(attempt.questionSnapshot, answers || []);

  attempt.answers = answers || [];
  attempt.score = scoring.score;
  attempt.endTime = now;
  attempt.status = isExpired ? "TIMEOUT" : "SUBMITTED";
  attempt.violationFlags = Array.isArray(violationFlags) ? violationFlags : [];
  await attempt.save();

  await Log.create({
    userId: req.user._id,
    action: attempt.status === "TIMEOUT" ? "EXAM_TIMEOUT_SUBMIT" : "SUBMIT_EXAM_ATTEMPT",
    ipAddress: req.ip,
    metadata: { examId: req.params.examId, attemptId: attempt._id, score: scoring.score }
  });

  return res.json({
    status: attempt.status,
    score: scoring.score,
    attempted: scoring.attempted,
    correct: scoring.correct,
    total: scoring.total
  });
}

export async function timeoutExam(req, res) {
  const { attemptId, sessionToken, answers, violationFlags } = req.body;
  const attempt = await Attempt.findOne({
    _id: attemptId,
    examId: req.params.examId,
    studentId: req.user._id
  }).select("+sessionTokenHash");

  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(409).json({ message: `Attempt already ${attempt.status}` });
  }

  if (!sessionToken || hashToken(sessionToken) !== attempt.sessionTokenHash) {
    return res.status(401).json({ message: "Invalid exam session token" });
  }

  if (attempt.ipAddress && attempt.ipAddress !== req.ip) {
    return res.status(409).json({ message: "Single device policy violated for this exam" });
  }

  const scoring = await closeAttemptAsTimeout(attempt, answers || [], req.ip);
  if (Array.isArray(violationFlags)) {
    attempt.violationFlags = violationFlags;
    await attempt.save();
  }

  await Log.create({
    userId: req.user._id,
    action: "FORCED_EXAM_TIMEOUT",
    ipAddress: req.ip,
    metadata: { examId: req.params.examId, attemptId: attempt._id, score: scoring.score }
  });

  return res.json({
    status: "TIMEOUT",
    score: scoring.score,
    attempted: scoring.attempted,
    correct: scoring.correct,
    total: scoring.total
  });
}
