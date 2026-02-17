import { User } from "../models/User.js";
import { Attempt } from "../models/Attempt.js";

export async function getAssignedStudents(req, res) {
  const proctor = req.user;
  const students = await User.find({ proctorId: proctor._id, role: "Student" }).select(
    "_id name email department"
  );

  return res.json({ students });
}

export async function getAssignedStudentPerformance(req, res) {
  const { studentId } = req.params;
  const student = await User.findOne({ _id: studentId, proctorId: req.user._id, role: "Student" });

  if (!student) {
    return res.status(404).json({ message: "Student not found under this proctor" });
  }

  const attempts = await Attempt.find({ studentId: student._id })
    .populate("examId", "title")
    .sort({ createdAt: -1 })
    .limit(50);

  return res.json({
    student: { id: student._id, name: student.name, email: student.email },
    attempts
  });
}
