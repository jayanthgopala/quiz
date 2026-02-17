import mongoose from "mongoose";

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    difficulty: { type: String, required: true },
    options: [{ type: String }],
    marks: { type: Number, required: true, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    answers: [{ questionId: mongoose.Schema.Types.ObjectId, answer: mongoose.Schema.Types.Mixed }],
    score: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    deadlineAt: { type: Date, required: true },
    ipAddress: { type: String, default: "" },
    violationFlags: [{ type: String }],
    status: { type: String, enum: ["IN_PROGRESS", "SUBMITTED", "TIMEOUT"], default: "IN_PROGRESS" },
    questionSnapshot: [questionSnapshotSchema],
    sessionTokenHash: { type: String, required: true, select: false }
  },
  { timestamps: true }
);

attemptSchema.index({ studentId: 1, examId: 1, createdAt: -1 });
attemptSchema.index({ examId: 1, studentId: 1, status: 1 });

export const Attempt = mongoose.model("Attempt", attemptSchema);
