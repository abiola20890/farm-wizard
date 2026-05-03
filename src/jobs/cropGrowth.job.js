
import cron from 'node-cron';
import FarmPlot from '../models/farm.model.js';

export const startCropGrowthJob = () => {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find all active (non-harvested) plots
      const activePlots = await FarmPlot.find({ isHarvested: false });

      for (const plot of activePlots) {
        const pct = plot.growthPercentage;
        let newStage = 'seed';

        if (pct >= 100) newStage = 'mature';
        else if (pct >= 66) newStage = 'growing';
        else if (pct >= 33) newStage = 'sprout';

        // Only update if stage changed
        if (plot.stage !== newStage) {
          plot.stage = newStage;
          await plot.save();
        }

        // Mark dead if past 2x growth time and not harvested
        const deadlineTime = new Date(plot.matureAt.getTime() + plot.growthDurationMinutes * 60 * 1000 * 2);
        if (now > deadlineTime && !plot.isHarvested) {
          plot.stage = 'dead';
          plot.isHarvested = true; // Remove from active plots
          await plot.save();
          console.log(`⚠️ Crop ${plot.cropName} on plot ${plot.plotNumber} has died (not harvested in time)`);
        }
      }
    } catch (error) {
      console.error('Crop growth job error:', error.message);
    }
  });

  console.log('🌱 Crop growth background job started (runs every minute)');
};