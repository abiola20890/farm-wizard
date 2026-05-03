
import mongoose from 'mongoose';

// CropType defines the blueprint for each crop species
const cropTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  emoji: {
    type: String,
    required: true,
  },
  growthDurationMinutes: {
    type: Number,
    required: true, // How long to fully grow (in minutes)
  },
  stages: {
    type: [String],
    default: ['seed', 'sprout', 'growing', 'mature'],
  },
  plantCost: {
    type: Number,
    required: true, // Coins needed to plant
  },
  harvestReward: {
    type: Number,
    required: true, // Coins earned on harvest
  },
  experienceReward: {
    type: Number,
    default: 10, // XP earned on harvest
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const CropType = mongoose.model('CropType', cropTypeSchema);
export default CropType;