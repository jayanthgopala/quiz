import { Router } from "express";
import { createUser, login, logout, me, refresh } from "../controllers/authController.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { authSchemas, validate } from "../middleware/validate.js";
import { Roles } from "../utils/roles.js";

const router = Router();

router.post("/login", validate(authSchemas.login), login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.post(
  "/users",
  requireAuth,
  requireRoles(Roles.ADMIN),
  validate(authSchemas.createUser),
  createUser
);

export default router;
