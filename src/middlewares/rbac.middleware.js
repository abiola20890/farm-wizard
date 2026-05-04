
import { errorResponse } from '../utils/response.js';

// Available roles in ascending privilege order
export const ROLES = {
  FARMER: 'farmer',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

const roleOrder = {
  farmer: 0,
  moderator: 1,
  admin: 2,
};

// restrictTo checks if the authenticated user has the required role
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'farmer';
    const hasPermission = allowedRoles.some(
      role => roleOrder[userRole] >= roleOrder[role]
    );

    if (!hasPermission) {
      return errorResponse(
        res, 403,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
      );
    }
    next();
  };
};