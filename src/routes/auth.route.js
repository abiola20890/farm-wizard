
import express from 'express';
import {
  register, login, refreshToken, getMe,
  forgotPassword, resetPassword,
  verifyMFA, enableMFA,
  getAllUsers,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-mfa', verifyMFA);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);


router.get('/me', protect, getMe);
router.post('/enable-mfa', protect, restrictTo('admin'), enableMFA);


router.get('/admin/users', protect, restrictTo('admin'), getAllUsers);

export default router;