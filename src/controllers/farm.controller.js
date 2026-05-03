
import FarmPlot from '../models/farm.model.js';
import CropType from '../models/crop.model.js';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';
import { successResponse, errorResponse } from '../utils/response.js';

const MAX_PLOTS = 6; // Each farmer has 6 plot slots

export const getFarmStatus = async (req, res) => {
  try {
    const plots = await FarmPlot.find({
      farmer: req.user._id,
      isHarvested: false,
    }).populate('cropType', 'name emoji growthDurationMinutes');

    // Update growth stages server-side
    const updatedPlots = plots.map(plot => {
      const pct = plot.growthPercentage;
      let stage = 'seed';
      if (pct >= 100) stage = 'mature';
      else if (pct >= 66) stage = 'growing';
      else if (pct >= 33) stage = 'sprout';
      plot.stage = stage;
      return plot.toJSON();
    });

    // Find available (empty) plot numbers
    const usedPlots = plots.map(p => p.plotNumber);
    const availablePlots = [];
    for (let i = 1; i <= MAX_PLOTS; i++) {
      if (!usedPlots.includes(i)) availablePlots.push(i);
    }

    return successResponse(res, 200, 'Farm status retrieved', {
      farmer: {
        username: req.user.username,
        coins: req.user.coins,
        level: req.user.level,
        experience: req.user.experience,
        totalHarvests: req.user.totalHarvests,
      },
      plots: updatedPlots,
      availablePlots,
      totalPlots: MAX_PLOTS,
      activeCrops: plots.length,
      readyToHarvest: updatedPlots.filter(p => p.isReady).length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

export const plantCrop = async (req, res) => {
  try {
    const { cropTypeId, plotNumber } = req.body;

    if (!cropTypeId || !plotNumber) {
      return errorResponse(res, 400, 'cropTypeId and plotNumber are required');
    }

    if (plotNumber < 1 || plotNumber > MAX_PLOTS) {
      return errorResponse(res, 400, `Plot number must be between 1 and ${MAX_PLOTS}`);
    }

    // Check if plot is already occupied
    const existingPlot = await FarmPlot.findOne({
      farmer: req.user._id,
      plotNumber,
      isHarvested: false,
    });

    if (existingPlot) {
      return errorResponse(res, 409, `Plot ${plotNumber} is already occupied`);
    }

    // Get crop type
    const cropType = await CropType.findById(cropTypeId);
    if (!cropType || !cropType.isActive) {
      return errorResponse(res, 404, 'Crop type not found');
    }

    // Check if user has enough coins
    const user = await User.findById(req.user._id);
    if (user.coins < cropType.plantCost) {
      return errorResponse(res, 400, `Not enough coins. Need ${cropType.plantCost}, have ${user.coins}`);
    }

    // Deduct coins
    const balanceBefore = user.coins;
    user.coins -= cropType.plantCost;
    await user.save();

    // Calculate mature time
    const plantedAt = new Date();
    const matureAt = new Date(plantedAt.getTime() + cropType.growthDurationMinutes * 60 * 1000);

    // Create farm plot
    const plot = await FarmPlot.create({
      farmer: req.user._id,
      cropType: cropType._id,
      cropName: cropType.name,
      cropEmoji: cropType.emoji,
      stage: 'seed',
      plantedAt,
      matureAt,
      growthDurationMinutes: cropType.growthDurationMinutes,
      harvestReward: cropType.harvestReward,
      experienceReward: cropType.experienceReward,
      plotNumber,
    });

    // Log transaction
    await Transaction.create({
      user: req.user._id,
      type: 'plant',
      amount: -cropType.plantCost,
      description: `Planted ${cropType.name} on plot ${plotNumber}`,
      cropName: cropType.name,
      balanceBefore,
      balanceAfter: user.coins,
    });

    return successResponse(res, 201, `${cropType.emoji} ${cropType.name} planted on plot ${plotNumber}!`, {
      plot: plot.toJSON(),
      coinsSpent: cropType.plantCost,
      coinsRemaining: user.coins,
      matureAt,
      growthDurationMinutes: cropType.growthDurationMinutes,
    });
  } catch (error) {
    console.error('plant error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const harvestCrop = async (req, res) => {
  try {
    const { plotNumber } = req.body;

    if (!plotNumber) {
      return errorResponse(res, 400, 'plotNumber is required');
    }

    // Find the plot
    const plot = await FarmPlot.findOne({
      farmer: req.user._id,
      plotNumber,
      isHarvested: false,
    });

    if (!plot) {
      return errorResponse(res, 404, `No active crop on plot ${plotNumber}`);
    }

    // Check if crop is mature — server-side validation prevents cheating
    if (Date.now() < plot.matureAt.getTime()) {
      const remainingSeconds = Math.ceil((plot.matureAt.getTime() - Date.now()) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return errorResponse(res, 400, `Crop is not ready yet. ${remainingMinutes} minute(s) remaining`);
    }

    // Mark as harvested
    plot.isHarvested = true;
    plot.harvestedAt = new Date();
    plot.stage = 'harvested';
    await plot.save();

    // Reward user
    const user = await User.findById(req.user._id);
    const balanceBefore = user.coins;
    user.coins += plot.harvestReward;
    user.experience += plot.experienceReward;
    user.totalHarvests += 1;

    // Level up logic: every 100 XP = 1 level
    const newLevel = Math.floor(user.experience / 100) + 1;
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    await user.save();

    // Log transaction
    await Transaction.create({
      user: req.user._id,
      type: 'harvest',
      amount: plot.harvestReward,
      description: `Harvested ${plot.cropName} from plot ${plotNumber}`,
      cropName: plot.cropName,
      balanceBefore,
      balanceAfter: user.coins,
    });

    return successResponse(res, 200, `🎉 ${plot.cropEmoji} ${plot.cropName} harvested successfully!`, {
      harvest: {
        cropName: plot.cropName,
        cropEmoji: plot.cropEmoji,
        plotNumber,
        coinsEarned: plot.harvestReward,
        experienceEarned: plot.experienceReward,
      },
      farmer: {
        coins: user.coins,
        level: user.level,
        experience: user.experience,
        totalHarvests: user.totalHarvests,
        leveledUp,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

export const getHarvestHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [plots, total] = await Promise.all([
      FarmPlot.find({ farmer: req.user._id, isHarvested: true })
        .sort({ harvestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('cropName cropEmoji harvestReward harvestedAt plotNumber'),
      FarmPlot.countDocuments({ farmer: req.user._id, isHarvested: true }),
    ]);

    return successResponse(res, 200, 'Harvest history retrieved', {
      history: plots,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};