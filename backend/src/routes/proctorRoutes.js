import { Router } from "express";
import {
  getAssignedStudentPerformance,
  getAssignedStudents
} from "../controllers/proctorController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { Roles } from "../utils/roles.js";

const router = Router();

router.use(requireAuth, requireRoles(Roles.STUDENT_PROCTOR));
router.get("/students", getAssignedStudents);
router.get("/students/:studentId/performance", getAssignedStudentPerformance);

export default router;
