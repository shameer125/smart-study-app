const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 280,
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
      pomodoro: {
        focusMinutes: { type: Number, default: 25 },
        shortBreak: { type: Number, default: 5 },
        longBreak: { type: Number, default: 15 },
      },
      dailyGoalHours: { type: Number, default: 4 },
    },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastActive: { type: Date },
    },
    isVerified: { type: Boolean, default: false },
    verification: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
      lastSentAt: { type: Date, select: false },
    },
    passwordReset: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verification;
  delete obj.passwordReset;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
