import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Log = mongoose.model("Log", logSchema);
