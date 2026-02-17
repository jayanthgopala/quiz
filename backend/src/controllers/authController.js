import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Log } from "../models/Log.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function buildTokens(user) {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

async function saveRefreshToken(userId, refreshToken) {
  const hash = await bcrypt.hash(refreshToken, 12);
  await User.findByIdAndUpdate(userId, { refreshTokenHash: hash });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password +refreshTokenHash");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const { accessToken, refreshToken } = buildTokens(user);
  await saveRefreshToken(user._id, refreshToken);

  await Log.create({
    userId: user._id,
    action: "LOGIN",
    ipAddress: req.ip,
    metadata: { role: user.role }
  });

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = buildTokens({ _id: user._id, role: decoded.role, email: decoded.email });
    await saveRefreshToken(user._id, tokens.refreshToken);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function logout(req, res) {
  await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });

  await Log.create({
    userId: req.user._id,
    action: "LOGOUT",
    ipAddress: req.ip
  });

  return res.json({ message: "Logged out" });
}

export async function createUser(req, res) {
  const created = await User.create(req.body);

  await Log.create({
    userId: req.user._id,
    action: "CREATE_USER",
    ipAddress: req.ip,
    metadata: { createdUserId: created._id, role: created.role }
  });

  return res.status(201).json({
    id: created._id,
    name: created.name,
    email: created.email,
    role: created.role,
    department: created.department,
    proctorId: created.proctorId
  });
}

export async function me(req, res) {
  return res.json(req.user);
}
