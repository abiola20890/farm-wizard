
import crypto from 'crypto';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a secure random token for password reset
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for safe storage
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};