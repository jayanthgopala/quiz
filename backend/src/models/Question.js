import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["MCQ", "MultiSelect", "Coding", "Numerical", "Descriptive"], required: true },
    subject: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    marks: { type: Number, required: true, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
