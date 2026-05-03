// src/controllers/auth.controller.js
import User from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';


export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return errorResponse(res, 400, 'Username, email and password are required');
    }

    const user = await User.create({ username, email, password });

    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    return successResponse(res, 201, 'Registration successful', {
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

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is deactivated');
    }

    const accessToken = generateAccessToken(user._id, user.username);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userObj = user.toJSON();

    return successResponse(res, 200, 'Login successful', {
      user: userObj,
      accessToken,
      refreshToken,
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
    if (!user) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

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