
import mongoose from 'mongoose';

// Transaction tracks every coin movement and reward event
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['plant', 'harvest', 'bonus', 'purchase', 'penalty'],
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Positive = earned, Negative = spent
  },
  description: {
    type: String,
    required: true,
  },
  cropName: String,
  balanceBefore: Number,
  balanceAfter: Number,
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

// Indexes for fast queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;