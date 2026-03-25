import { Router } from 'express';
import { getAnalyticsHandler } from '../handlers/analytics.handler.ts';

const router = Router();

router.get('/', getAnalyticsHandler);

export default router;
