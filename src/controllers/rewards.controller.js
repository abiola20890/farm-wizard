
import Transaction from '../models/transaction.model.js';
import CropType from '../models/crop.model.js';
import User from '../models/user.model.js';
import { successResponse, errorResponse } from '../utils/response.js';


export const getRewards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [transactions, total, user] = await Promise.all([
      Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: req.user._id }),
      User.findById(req.user._id),
    ]);

    // Aggregate stats
    const stats = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    stats.forEach(s => { statsMap[s._id] = { total: s.total, count: s.count }; });

    return successResponse(res, 200, 'Rewards retrieved', {
      wallet: {
        coins: user.coins,
        level: user.level,
        experience: user.experience,
        totalHarvests: user.totalHarvests,
        nextLevelXP: user.level * 100,
        currentLevelXP: user.experience % 100,
      },
      stats: statsMap,
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

export const getCrops = async (req, res) => {
  try {
    const crops = await CropType.find({ isActive: true }).sort({ plantCost: 1 });
    return successResponse(res, 200, 'Available crops retrieved', { crops });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .sort({ coins: -1, totalHarvests: -1 })
      .limit(10)
      .select('username coins level totalHarvests experience');

    return successResponse(res, 200, 'Leaderboard retrieved', { leaderboard: users });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};