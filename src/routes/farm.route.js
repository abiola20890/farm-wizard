
import express from 'express';
import { getFarmStatus, plantCrop, harvestCrop, getHarvestHistory } from '../controllers/farm.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All farm routes require authentication

router.get('/status', getFarmStatus);
router.post('/plant', plantCrop);
router.post('/harvest', harvestCrop);
router.get('/history', getHarvestHistory);

export default router;