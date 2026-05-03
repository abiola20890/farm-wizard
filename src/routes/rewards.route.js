
import express from 'express';
import { getRewards, getCrops, getLeaderboard } from '../controllers/rewards.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/rewards', protect, getRewards);
router.get('/crops', getCrops); // Public — anyone can see available crops
router.get('/leaderboard', getLeaderboard); // Public leaderboard

export default router;