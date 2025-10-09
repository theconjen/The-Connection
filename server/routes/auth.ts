import { Router } from 'express';
import authRoutes from './api/auth';
import accountRoutes from './account';
import userRoutes from './api/user';
import userSettingsRoutes from './userSettingsRoutes';
import { FEATURES } from '../config/features';

const router = Router();

// Mount existing modular route files that live in server/routes/api
router.use('/api', authRoutes);
router.use('/api', accountRoutes);
router.use('/api/user', userRoutes);
router.use('/api/user', userSettingsRoutes);

export default router;
