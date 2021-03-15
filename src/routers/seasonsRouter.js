import express from 'express';

import { router as episodesRouter } from './episodesRouter.js';

export const router = express.Router();

router.use('/{episodeId}/episode', episodesRouter);

// skilar fylki af öllum seasons fyrir sjónvarps seríu
// router.get('/', catchErrors(allAvailable));

// býr til nýtt í season í sjónvarps seríu, aðeins ef notandi er stjórnandi
// router.post('/', catchErrors(allAvailable));

// skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum
// router.get('/{seasonId}', catchErrors(allAvailable));

// eyðir season, aðeins ef notandi er stjórnandi
// router.delete('/{seasonId}', catchErrors(allAvailable));
