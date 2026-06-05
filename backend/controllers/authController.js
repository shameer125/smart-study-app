const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const {
  generateCode,
  sendVerification,
  sendPasswordReset,
  sendWelcome,
  getMode,
} = require('../utils/email');

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const sanitizeErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors
      .array()
      .map((e) => e.msg)
      .join(', ');
  }
  return null;
};

const register = asyncHandler(async (req, res) => {
  const validationMsg = sanitizeErrors(req);
  if (validationMsg) {
    return res.status(400).json({ success: false, message: validationMsg });
  }

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  const code = generateCode();
  const user = await User.create({
    name,
    email,
    password,
    isVerified: false,
    verification: {
      code,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  try {
    await sendVerification(user, code);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email.',
    token,
    user: user.toSafeJSON(),
    requiresVerification: true,
    devMailMode: getMode(),
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+verification.code +verification.expiresAt +verification.attempts'
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.isVerified) {
    return res.json({ success: true, message: 'Email already verified', user: user.toSafeJSON() });
  }

  if (!user.verification?.code || !user.verification?.expiresAt) {
    return res.status(400).json({ success: false, message: 'No active code. Please request a new one.' });
  }

  if (new Date() > user.verification.expiresAt) {
    return res.status(400).json({ success: false, message: 'Code has expired. Request a new one.' });
  }

  if ((user.verification.attempts || 0) >= 6) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many attempts. Request a new code.' });
  }

  if (String(user.verification.code) !== String(code).trim()) {
    user.verification.attempts = (user.verification.attempts || 0) + 1;
    await user.save();
    return res.status(400).json({ success: false, message: 'Invalid verification code' });
  }

  user.isVerified = true;
  user.verification = undefined;
  await user.save();

  try {
    await sendWelcome(user);
  } catch {
    /* non-fatal */
  }

  const token = generateToken(user._id);
  res.json({
    success: true,
    message: 'Email verified successfully',
    token,
    user: user.toSafeJSON(),
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+verification.lastSentAt'
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email is already verified' });
  }

  const last = user.verification?.lastSentAt;
  if (last && Date.now() - new Date(last).getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - new Date(last).getTime())) / 1000
    );
    return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another code.` });
  }

  const code = generateCode();
  user.verification = {
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0,
    lastSentAt: new Date(),
  };
  await user.save();

  try {
    await sendVerification(user, code);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.json({ success: true, message: 'Verification code sent', devMailMode: getMode() });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordReset.lastSentAt'
  );

  // Always respond OK to avoid email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, a reset code has been sent.',
    });
  }

  const last = user.passwordReset?.lastSentAt;
  if (last && Date.now() - new Date(last).getTime() < RESEND_COOLDOWN_MS) {
    return res.json({
      success: true,
      message: 'A reset code was recently sent. Please check your inbox.',
    });
  }

  const code = generateCode();
  user.passwordReset = {
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    lastSentAt: new Date(),
  };
  await user.save();

  try {
    await sendPasswordReset(user, code);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.json({
    success: true,
    message: 'If that email exists, a reset code has been sent.',
    devMailMode: getMode(),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email, code, and new password are required' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordReset.code +passwordReset.expiresAt'
  );
  if (!user || !user.passwordReset?.code) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid or expired reset code' });
  }
  if (new Date() > user.passwordReset.expiresAt) {
    return res
      .status(400)
      .json({ success: false, message: 'Reset code has expired. Request a new one.' });
  }
  if (String(user.passwordReset.code) !== String(code).trim()) {
    return res.status(400).json({ success: false, message: 'Invalid reset code' });
  }

  user.password = password;
  user.passwordReset = undefined;
  await user.save();

  const token = generateToken(user._id);
  res.json({
    success: true,
    message: 'Password reset successful',
    token,
    user: user.toSafeJSON(),
  });
});

const login = asyncHandler(async (req, res) => {
  const validationMsg = sanitizeErrors(req);
  if (validationMsg) {
    return res.status(400).json({ success: false, message: validationMsg });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Welcome back!',
    token,
    user: user.toSafeJSON(),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: user.toSafeJSON() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { name, bio, avatar, preferences, password } = req.body;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (preferences && typeof preferences === 'object') {
    const currentPrefs = user.preferences?.toObject?.() || user.preferences || {};
    user.preferences = { ...currentPrefs, ...preferences };
    if (preferences.pomodoro) {
      const currentPomo = currentPrefs.pomodoro || {};
      user.preferences.pomodoro = { ...currentPomo, ...preferences.pomodoro };
    }
  }
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    user.password = password;
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated', user: user.toSafeJSON() });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
