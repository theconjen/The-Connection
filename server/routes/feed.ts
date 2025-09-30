import { Router } from 'express';
import mvpRoutes from './mvp';

const router = Router();

// Reuse the MVP feed route for now
router.use('/', mvpRoutes);

export default router;
