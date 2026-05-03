
import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
};