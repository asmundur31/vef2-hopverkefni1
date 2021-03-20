/* eslint-disable no-underscore-dangle */
import express from 'express';
import { catchErrors } from '../utils.js';
import {
  selectSeasonsPaging,
  selectSeason,
  selectEpisodes,
  selectCountSeasons,
} from '../db.js';

export const router = express.Router({ mergeParams: true });

async function getAllSeasons(req, res) {
  const { seriesId } = req.params;
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const answer = await selectSeasonsPaging(seriesId, offset, limit);

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
  const e = await selectEpisodes(seriesId, seasonId);
  season = {
    season,
    episodes: e,
  };
  return res.json(season);
}

function createSeason(req, res) {
  const { seriesId } = req.params;
  const createdSeason = {
    newSeason: `Búum til nýtt season fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(createdSeason);
}

function deleteSeason(req, res) {
  const { seriesId, seasonId } = req.params;
  const deletedSeason = {
    delete: `Eyðum season með seasonNumber = ${seasonId} fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedSeason);
}

// skilar fylki af öllum seasons fyrir sjónvarps seríu
router.get('/', catchErrors(getAllSeasons));
// býr til nýtt í season í sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post('/', catchErrors(createSeason));
// skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum
router.get('/:seasonId', catchErrors(getOneSeason));
// eyðir season, aðeins ef notandi er stjórnandi
router.delete('/:seasonId', catchErrors(deleteSeason));
