/* eslint-disable no-underscore-dangle */
import express from 'express';
import pkg from 'express-validator';
import { catchErrors } from '../utils.js';
import {
  selectSeasonsPaging,
  selectSeason,
  selectEpisodes,
  selectCountSeasons,
  deleteSeason,
  insertSeason,
  deleteEpisodesInSeason,
} from '../db.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { validationSeason, sanitizeSeason } from '../validation.js';

const { validationResult } = pkg;

export const router = express.Router({ mergeParams: true });

async function getAllSeasons(req, res) {
  const { seriesId } = req.params;
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const answer = await selectSeasonsPaging(seriesId, offset, limit);
  if (!answer) {
    // Númer á villu?
    return res.json({ error: 'Ekki tókst að ná í þáttaröð' });
  }

  if (answer.length === 0) {
    return res.status(404).json({ error: 'Engar þáttaraðir á þessu bili' });
  }

  const count = await selectCountSeasons();
  const links = {
    _links: {
      self: {
        href: `${req.baseUrl}/?offset=${offset}&limit=${limit}`,
      },
    },
  };

  if (offset > 0) {
    links._links.prev = {
      href: `${req.baseUrl}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  // eslint-disable-next-line eqeqeq
  if (answer.length == limit && offset + limit != count) {
    links._links.next = {
      href: `${req.baseUrl}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  const allSeasons = {
    limit,
    offset,
    items: answer,
    links,
  };
  return res.json(allSeasons);
}

async function getOneSeason(req, res) {
  const { seriesId, seasonId } = req.params;
  let season = await selectSeason(seriesId, seasonId);
  if (season.length === 0) {
    return res.status(404).json({ error: 'Engin þáttaröð með þetta númer (id)' });
  }
  const e = await selectEpisodes(seasonId, seriesId);
  if (!e) {
    // Númer á villu?
    return res.json({ error: 'Ekki tókst að ná í þætti' });
  }

  season = {
    season,
    episodes: e,
  };
  return res.json(season);
}

async function createSeason(req, res) {
  const { seriesId } = req.params;
  const {
    name,
    number,
    airDate,
    overview,
    poster,
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
    poster,
    serieId: seriesId,
  };

  const result = await selectSeason(seriesId, number);
  if (result) {
    return res.status(400).json({ error: 'Þáttaröð er nú þegar til' });
  }

  const answer = await insertSeason(data);
  if (!answer) {
    return res.status(400).json({ error: 'Gögn brjóta gegn gildum sem eru í gagnagrunni' });
  }

  const createdSeason = {
    newSeason: 'Nýtt season búið til',
  };
  return res.json(createdSeason);
}

async function deleteSeasonR(req, res) {
  const { seriesId, seasonId } = req.params;

  // Eyðum fyrst þáttum í seasoni
  const answerE = await deleteEpisodesInSeason(seasonId, seriesId);
  if (!answerE) {
    return res.json({ error: 'Ekki tókst að eyða þátttum' });
  }

  const answerS = await deleteSeason(seasonId, seriesId);
  if (!answerS) {
    return res.json({ error: 'Ekki tókst að eyða þáttaröð' });
  }
  const deletedSeason = {
    delete: 'Season eytt',
  };
  return res.json(deletedSeason);
}

// skilar fylki af öllum seasons fyrir sjónvarps seríu
router.get('/', catchErrors(getAllSeasons));
// býr til nýtt í season í sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post(
  '/',
  validationSeason,
  sanitizeSeason,
  requireAuthentication,
  ensureAdmin,
  catchErrors(createSeason),
);
// skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum
router.get('/:seasonId', catchErrors(getOneSeason));
// eyðir season, aðeins ef notandi er stjórnandi
router.delete(
  '/:seasonId',
  requireAuthentication,
  ensureAdmin,
  catchErrors(deleteSeasonR),
);
