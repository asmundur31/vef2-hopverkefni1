import express from 'express';

import { router as seasonsRouter } from './seasonsRouter.js';
import { router as seriesAndUsersRouter } from './seriesAndUsersRouter.js';

export const router = express.Router();

router.use('/{seriesId}/season', seasonsRouter);
router.use('/{seriesId}', seriesAndUsersRouter);

// skilar síðum af sjónvarps seríum með grunnupplýsingum
// router.get('/', catchErrors(allAvailable));

// býr til nýja sjónvarps seríu, aðeins ef notandi er stjórnandi
// router.post('/', catchErrors(allAvailable));

