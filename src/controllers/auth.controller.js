
import crypto from 'crypto';
import User from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateOTP, generateResetToken, hashToken } from '../utils/otp.js';
import { successResponse, errorResponse } from '../utils/response.js';


export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return errorResponse(res, 400, 'Username, email and password are required');
    }

    const user = await User.create({ username, email, password, role: 'farmer' });
    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 201, 'Registration successful — welcome to Farm Wizard!', {
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return errorResponse(res, 409, `${field} already exists`);
    }
    return errorResponse(res, 500, error.message);
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password +mfaOTP +mfaOTPExpires');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid email or password');
    }
    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is deactivated');
    }

   
    if (user.role === 'admin' && user.mfaEnabled) {
      // Generate OTP and store hashed
      const otp = generateOTP();
      user.mfaOTP = hashToken(otp);
      user.mfaOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.mfaVerified = false;
      await user.save();

      
      return successResponse(res, 200, 'MFA required — OTP generated', {
        mfaRequired: true,
        email: user.email,
        otp, // ⚠️ In production remove this and send via email
        message: 'Submit OTP to POST /api/v1/auth/verify-mfa to complete login',
      });
    }

    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


export const verifyMFA = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required');
    }

    const user = await User.findOne({ email }).select('+mfaOTP +mfaOTPExpires');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check OTP expiry
    if (!user.mfaOTPExpires || user.mfaOTPExpires < new Date()) {
      return errorResponse(res, 400, 'OTP has expired — please login again');
    }

    // Verify OTP hash
    const hashedOTP = hashToken(otp);
    if (hashedOTP !== user.mfaOTP) {
      return errorResponse(res, 401, 'Invalid OTP');
    }

    // Clear OTP fields
    user.mfaOTP = undefined;
    user.mfaOTPExpires = undefined;
    user.mfaVerified = true;
    await user.save();

    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 200, 'MFA verified — login successful', {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(res, 200, 'If that email exists, a reset token has been sent');
    }

    const resetToken = generateResetToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();


    return successResponse(res, 200, 'Password reset token generated', {
      resetToken, // ⚠️ In production send via email, not in response
      expiresIn: '10 minutes',
      message: 'Submit to POST /api/v1/auth/reset-password/:token',
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(res, 400, 'New password is required');
    }
    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    // Hash the incoming token and compare
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Set new password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 200, 'Password reset successful', {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


export const enableMFA = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 403, 'MFA is only available for admin accounts');
    }

    req.user.mfaEnabled = true;
    await req.user.save();

    return successResponse(res, 200, 'MFA enabled for your admin account', {
      mfaEnabled: true,
      message: 'You will receive an OTP on every login',
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token is required');
    }
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return errorResponse(res, 401, 'Invalid refresh token');

    const newAccessToken = generateAccessToken(user._id, user.username);
    const newRefreshToken = generateRefreshToken(user._id);

    return successResponse(res, 200, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired refresh token');
  }
};


export const getMe = async (req, res) => {
  return successResponse(res, 200, 'User profile', { user: req.user });
};


export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return successResponse(res, 200, 'All users retrieved', {
      users, total, page, pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};