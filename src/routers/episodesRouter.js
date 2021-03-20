import express from 'express';
import { selectEpisode } from '../db.js';
import { catchErrors } from '../utils.js';

export const router = express.Router({ mergeParams: true });

function newEpisode(req, res) {
  const { seriesId, seasonId } = req.params;
  const episode = {
    episode: `Nýr þáttur búinn til fyrir season með seasonId = ${seasonId} og seríu með seriesId = ${seriesId}`,
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

function deleteEpisode(req, res) {
  const { seriesId, seasonId, episodeId } = req.params;
  const episode = {
    delete: `Eyðum þátt með episodeId = ${episodeId}, seasonId = ${seasonId} og seriesId = ${seriesId}`,
  };
  return res.json(episode);
}

// býr til nýjan þátt í season, aðeins ef notandi er stjórnandi
router.post('/', catchErrors(newEpisode));
// skilar upplýsingum um þátt
router.get('/:episodeId', catchErrors(getEpisode));
// eyðir þætti, aðeins ef notandi er stjórnandi
router.delete('/:episodeId', catchErrors(deleteEpisode));
