import 'dotenv/config';
import app from './src/app.js';

import connectDB from './src/config/db.js';
import { seedCrops } from './src/config/seedCrops.js';
import { startCropGrowthJob } from './src/jobs/cropGrowth.job.js';

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB();
    await seedCrops();
    startCropGrowthJob();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

start();