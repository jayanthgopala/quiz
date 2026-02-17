import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { roleValues } from "../utils/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: roleValues, required: true },
    department: { type: String, default: "" },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    proctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    refreshTokenHash: { type: String, default: null, select: false }
  },
  { timestamps: true }
);

userSchema.pre("save", async function userPreSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
