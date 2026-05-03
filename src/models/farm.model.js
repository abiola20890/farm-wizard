
import mongoose from 'mongoose';

// FarmPlot represents a single crop slot on a user's farm
const farmPlotSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  cropType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropType',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
  },
  cropEmoji: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    enum: ['seed', 'sprout', 'growing', 'mature', 'harvested', 'dead'],
    default: 'seed',
  },
  plantedAt: {
    type: Date,
    default: Date.now,
  },
  matureAt: {
    type: Date,
    required: true, // When crop will be fully grown
  },
  harvestedAt: {
    type: Date,
  },
  growthDurationMinutes: {
    type: Number,
    required: true,
  },
  harvestReward: {
    type: Number,
    required: true,
  },
  experienceReward: {
    type: Number,
    default: 10,
  },
  isHarvested: {
    type: Boolean,
    default: false,
    index: true,
  },
  plotNumber: {
    type: Number,
    required: true, // Which plot slot (1-6)
  },
}, { timestamps: true });

// Virtual: current growth percentage (0-100)
farmPlotSchema.virtual('growthPercentage').get(function () {
  if (this.isHarvested) return 100;
  const now = Date.now();
  const planted = this.plantedAt.getTime();
  const mature = this.matureAt.getTime();
  const total = mature - planted;
  const elapsed = now - planted;
  const percentage = Math.min(Math.round((elapsed / total) * 100), 100);
  return percentage;
});

// Virtual: time remaining in seconds
farmPlotSchema.virtual('timeRemainingSeconds').get(function () {
  if (this.isHarvested) return 0;
  const remaining = Math.max(0, this.matureAt.getTime() - Date.now());
  return Math.round(remaining / 1000);
});

// Virtual: is ready to harvest
farmPlotSchema.virtual('isReady').get(function () {
  return !this.isHarvested && Date.now() >= this.matureAt.getTime();
});

farmPlotSchema.set('toJSON', { virtuals: true });
farmPlotSchema.set('toObject', { virtuals: true });

// Compound index: one crop per plot per farmer
farmPlotSchema.index({ farmer: 1, plotNumber: 1 });

const FarmPlot = mongoose.model('FarmPlot', farmPlotSchema);
export default FarmPlot;