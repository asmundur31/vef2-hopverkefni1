import express from 'express';
import pkg from 'express-validator';
import multer from 'multer';

import {
  requireAuthentication,
  authenticateIfLoggedIn,
  ensureAdmin,
} from '../authentication.js';
import { catchErrors } from '../utils.js';
import {
  validationRating,
  xssSanitizationMiddleware,
  sanitizeSerie,
  validationNewRating,
  validationUpdateRating,
  validationState,
  validationNewState,
  validationUpdateState,
  validationUpdateSeries,
  validateImage,
} from '../validation.js';
import {
  newRating,
  updateRating,
  newState,
  stateUpdate,
} from '../users.js';
import {
  getRatingStatus,
  getSeriesOne,
  seriesUpdate,
  deleteEpisodesInSeries,
  deleteSeasonsInSeries,
  deleteSeries,
} from '../db.js';

const { validationResult } = pkg;
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'data/img/');
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

export const router = express.Router({ mergeParams: true });

async function getOneSeries(req, res) {
  const { seriesId } = req.params;
  const oneSeries = await getSeriesOne(seriesId);
  if (!oneSeries) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Ef eitthver er loggaður inn
  if (req.user) {
    // Bætum við rate og state ef það er til
    const rateState = await getRatingStatus(req.user.id, seriesId);
    if (rateState && rateState.rate) {
      oneSeries.rate = rateState.rate;
    }
    if (rateState && rateState.state) {
      oneSeries.state = rateState.state;
    }
  }
  return res.json(oneSeries);
}

async function updateSeries(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty() || req.imageError) {
    if (req.imageError) {
      errors.errors.push(req.imageError);
    }
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const data = req.body;
  const image = req.file;
  const updatedSeries = await seriesUpdate(seriesId, data, image);
  return res.json(updatedSeries);
}

async function deleteSeriesR(req, res) {
  const { seriesId } = req.params;

  // Eyðum fyrst þáttum í seríu
  const answerE = await deleteEpisodesInSeries(seriesId);
  if (!answerE) {
    return res.json({ error: 'Ekki tókst að eyða þátttum' });
  }

  // Næst eyðum við seasons í seríu
  const answerSeason = await deleteSeasonsInSeries(seriesId);
  if (!answerSeason) {
    return res.json({ error: 'Ekki tókst að eyða þáttaröðum' });
  }

  // Eyðum loks seríu
  const answerSerie = await deleteSeries(seriesId);
  if (!answerSerie) {
    return res.json({ error: 'Ekki tókst að eyða sjónvarpsþætti' });
  }

  const deletedSeries = {
    delete: `Eyðum seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedSeries);
}

async function addRate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const { rating } = req.body;
  const rateState = await getRatingStatus(req.user.id, seriesId);
  let rate;
  // Ef lína í gagnagrunni er til
  if (rateState) {
    rate = await updateRating(req.user.id, seriesId, rating);
  } else {
    rate = await newRating(req.user.id, seriesId, rating);
  }
  return res.json(rate);
}

async function updateRate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const { rating } = req.body;
  const rate = await updateRating(req.user.id, seriesId, rating);
  return res.json(rate);
}

async function deleteRate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const deletedRating = await updateRating(req.user.id, seriesId);
  return res.json(deletedRating);
}

async function addState(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const { state } = req.body;
  const rateState = await getRatingStatus(req.user.id, seriesId);
  let stateNew;
  // Ef lína í gagnagrunni er til
  if (rateState) {
    stateNew = await stateUpdate(req.user.id, seriesId, state);
  } else {
    stateNew = await newState(req.user.id, seriesId, state);
  }
  return res.json(stateNew);
}

async function updateState(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { seriesId } = req.params;
  const { state } = req.body;
  const updatedState = await stateUpdate(req.user.id, seriesId, state);
  return res.json(updatedState);
}

async function deleteState(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json(errors);
  }
  const { seriesId } = req.params;
  const stateDeleted = await stateUpdate(req.user.id, seriesId);
  return res.json(stateDeleted);
}

// skilar einni sjónvarps seríu með seriesId
// Ef notandi er innskráður skal sýna einkunn og stöðu viðkomandi á sjónvarps seríu.
router.get(
  '/',
  authenticateIfLoggedIn,
  catchErrors(getOneSeries),
);
// uppfærir sjónvarps seríu, reit fyrir reit, aðeins ef notandi er stjórnandi
router.patch(
  '/',
  requireAuthentication,
  ensureAdmin,
  upload.single('image'),
  validateImage,
  validationUpdateSeries,
  sanitizeSerie,
  catchErrors(updateSeries),
);
// eyðir sjónvarps seríu, aðeins ef notandi er stjórnandi
router.delete(
  '/',
  requireAuthentication,
  ensureAdmin,
  catchErrors(deleteSeriesR),
);

// skráir einkunn innskráðs notanda á sjónvarps seríu, aðeins fyrir innskráða notendur
router.post(
  '/rate',
  requireAuthentication,
  validationRating,
  validationNewRating,
  xssSanitizationMiddleware,
  catchErrors(addRate),
);
// uppfærir einkunn innskráðs notanda á sjónvarps seríu
router.patch(
  '/rate',
  requireAuthentication,
  validationRating,
  validationUpdateRating,
  xssSanitizationMiddleware,
  catchErrors(updateRate),
);
// eyðir einkunn innskráðs notanda á sjónvarps seríu
router.delete(
  '/rate',
  requireAuthentication,
  validationUpdateRating,
  catchErrors(deleteRate),
);

// skráir stöðu innskráðs notanda á sjónvarps seríu, aðeins fyrir innskráða notendur
router.post(
  '/state',
  requireAuthentication,
  validationState,
  validationNewState,
  xssSanitizationMiddleware,
  catchErrors(addState),
);
// uppfærir stöðu innskráðs notanda á sjónvarps seríu
router.patch(
  '/state',
  requireAuthentication,
  validationState,
  validationUpdateState,
  xssSanitizationMiddleware,
  catchErrors(updateState),
);
// eyðir stöðu innskráðs notanda á sjónvarps seríu
router.delete(
  '/state',
  requireAuthentication,
  validationUpdateState,
  catchErrors(deleteState),
);
