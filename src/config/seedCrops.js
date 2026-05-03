
import CropType from '../models/crop.model.js';

const defaultCrops = [
  {
    name: 'Tomato',
    emoji: '🍅',
    growthDurationMinutes: 2,
    plantCost: 10,
    harvestReward: 25,
    experienceReward: 15,
    description: 'A classic red tomato. Fast growing and profitable.',
  },
  {
    name: 'Corn',
    emoji: '🌽',
    growthDurationMinutes: 5,
    plantCost: 20,
    harvestReward: 55,
    experienceReward: 25,
    description: 'Golden corn. Takes longer but yields more coins.',
  },
  {
    name: 'Strawberry',
    emoji: '🍓',
    growthDurationMinutes: 3,
    plantCost: 15,
    harvestReward: 35,
    experienceReward: 20,
    description: 'Sweet strawberries. Good balance of time and reward.',
  },
  {
    name: 'Watermelon',
    emoji: '🍉',
    growthDurationMinutes: 10,
    plantCost: 40,
    harvestReward: 120,
    experienceReward: 50,
    description: 'Big and juicy. High investment, high reward.',
  },
  {
    name: 'Carrot',
    emoji: '🥕',
    growthDurationMinutes: 1,
    plantCost: 5,
    harvestReward: 12,
    experienceReward: 8,
    description: 'Quick and cheap. Perfect for beginners.',
  },
  {
    name: 'Pumpkin',
    emoji: '🎃',
    growthDurationMinutes: 15,
    plantCost: 60,
    harvestReward: 200,
    experienceReward: 80,
    description: 'The legendary pumpkin. Rare and extremely valuable.',
  },
];

export const seedCrops = async () => {
  try {
    const count = await CropType.countDocuments();
    if (count === 0) {
      await CropType.insertMany(defaultCrops);
      console.log(`🌾 Seeded ${defaultCrops.length} crop types`);
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};