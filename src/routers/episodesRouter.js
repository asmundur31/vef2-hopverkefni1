import express from 'express';
import pkg from 'express-validator';
import { selectEpisode, deleteEpisode, insertEpisode } from '../db.js';
import { catchErrors } from '../utils.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { sanitizeEpisode, validationEpisode } from '../validation.js';

const { validationResult } = pkg;

export const router = express.Router({ mergeParams: true });

async function newEpisode(req, res) {
  const { seriesId, seasonId } = req.params;
  const {
    name,
    number,
    airDate,
    overview,
  } = req.body;

  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    const errors = validation.array();
    return res.status(400).json(errors);
  }
  const data = {
    name,
    number,
    airDate,
    overview,
    season: seasonId,
    serieId: seriesId,
  };

  const result = await selectEpisode(number, seasonId, seriesId);
  if (result.length !== 0) {
    return res.status(400).json({ error: 'Þáttur er nú þegar til' });
  }

  const answer = await insertEpisode(data);
  if (!answer) {
    return res.status(400).json({ error: 'Gögn brjóta gegn gildum sem eru í gagnagrunni' });
  }

  const episode = {
    episode: 'Nýr þáttur búinn til',
  };
  return res.json(episode);
}

async function getEpisode(req, res) {
  const { seriesId, seasonId, episodeId } = req.params;
  const e = await selectEpisode(episodeId, seasonId, seriesId);
  if (e.length === 0) {
    return res.status(404).json({ error: 'Enginn þáttur með þetta númer (id)' });
  }
  return res.json(e);
}

async function deleteEpisodeR(req, res) {
  const { seriesId, seasonId, episodeId } = req.params;

  const answer = await deleteEpisode(episodeId, seasonId, seriesId);
  if (!answer) {
    return res.json({ error: 'Ekki tókst að eyða þætti' });
  }

  const episode = {
    delete: 'Þáttur eyddur',
  };
  return res.json(episode);
}

// býr til nýjan þátt í season, aðeins ef notandi er stjórnandi
router.post(
  '/',
  validationEpisode,
  sanitizeEpisode,
  requireAuthentication,
  ensureAdmin,
  catchErrors(newEpisode),
);
// skilar upplýsingum um þátt
router.get('/:episodeId', catchErrors(getEpisode));
// eyðir þætti, aðeins ef notandi er stjórnandi
router.delete(
  '/:episodeId',
  requireAuthentication,
  ensureAdmin,
  catchErrors(deleteEpisodeR),
);
