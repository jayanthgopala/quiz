import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select("_id name email role department");

    if (!user) {
      return res.status(401).json({ message: "Invalid token subject" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
