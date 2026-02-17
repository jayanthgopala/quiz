import { Router } from "express";
import {
  createExam,
  getExamDetails,
  listExamsForUser,
  startExam,
  submitExam,
  timeoutExam
} from "../controllers/examController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { examSchemas, validate } from "../middleware/validate.js";
import { Roles } from "../utils/roles.js";

const router = Router();

router.use(requireAuth);

router.get("/", listExamsForUser);
router.get("/:examId", validate(examSchemas.examIdParam), getExamDetails);
router.post(
  "/",
  requireRoles(Roles.ADMIN, Roles.PROFESSOR),
  validate(examSchemas.createExam),
  createExam
);

router.post(
  "/:examId/start",
  requireRoles(Roles.STUDENT),
  validate(examSchemas.examIdParam),
  startExam
);
router.post(
  "/:examId/submit",
  requireRoles(Roles.STUDENT),
  validate(examSchemas.submitExam),
  submitExam
);
router.post(
  "/:examId/timeout",
  requireRoles(Roles.STUDENT),
  validate(examSchemas.submitExam),
  timeoutExam
);

export default router;
