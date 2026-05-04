
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },

  // ── RBAC  ──────────────────────────────────────────────
  role: {
    type: String,
    enum: ['farmer', 'moderator', 'admin'],
    default: 'farmer',
    index: true,
  },

  // ── Game State ─────────────────────────────────────────────────────────
  coins: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  totalHarvests: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // ── Password Reset  ──────────────────────────────────
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  // ── MFA — Admin OTP  ─────────────────────────────────
  mfaEnabled: { type: Boolean, default: false },
  mfaOTP: { type: String, select: false },
  mfaOTPExpires: { type: Date, select: false },
  mfaVerified: { type: Boolean, default: false }, // true after OTP confirmed

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.mfaOTP;
  delete obj.mfaOTPExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;