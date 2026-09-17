import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import * as ctrl from './controller';
import { getWeatherSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(getWeatherSchema), ctrl.getWeather);

export default router;
