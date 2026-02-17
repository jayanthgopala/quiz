import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
    duration: { type: Number, required: true, min: 1 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    assignedBatch: { type: String, required: true },
    attemptLimit: { type: Number, default: 1, min: 1 },
    randomizeQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Exam = mongoose.model("Exam", examSchema);
