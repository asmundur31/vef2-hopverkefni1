/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
import express from 'express';
import pkg from 'express-validator';

import { catchErrors } from '../utils.js';
import {
  selectSeriesPaging,
  selectCountSeries,
  insertSerie,
  selectGenreId,
  insertSeriesGenres,
  insertGenres,
} from '../db.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { validationSerie, sanitizeSerie } from '../validation.js';

const { validationResult } = pkg;

export const router = express.Router({ mergeParams: true });

async function getSeries(req, res) {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const answer = await selectSeriesPaging(offset, limit);
  if (!answer) {
    return res.json({ error: 'Ekki tókst að ná í sjónvarpsþætti' });
  }

  if (answer.length === 0) {
    return res.status(404).json({ error: 'Enginn sjónvarpsþáttur á þessu bili' });
  }
  const count = await selectCountSeries();
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

  const series = {
    limit,
    offset,
    items: answer,
    links,
  };
  return res.json(series);
}

async function newSeries(req, res) {
  const {
    id,
    name,
    airDate,
    inProduction,
    tagline,
    image,
    description,
    language,
    network,
    url,
    genre,
  } = req.body;

  const data = {
    id,
    name,
    airDate,
    inProduction,
    tagline,
    image,
    description,
    language,
    network,
    url,
  };

  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    const errors = validation.array();
    return res.status(400).json(errors);
  }

  const answer = await insertSerie(data);
  if (!answer) {
    return res.status(400).json({ error: 'Gögn brjóta gegn gildum sem eru í gagnagrunni' });
  }

  const genres = genre.split(', ');

  for (const g of genres) {
    const result = await selectGenreId(g);
    if (result.rows.length !== 0) {
      await insertSeriesGenres(id, result.rows[0].id);
    } else {
      const genreId = await insertGenres(g);
      await insertSeriesGenres(id, genreId.rows[0].id);
    }
  }

  const newData = {
    newSeries: 'Nýr sjónvarpsþáttur búinn til',
  };
  return res.json(newData);
}

// skilar síðum af sjónvarps seríum með grunnupplýsingum
router.get('/', catchErrors(getSeries));
// býr til nýja sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post(
  '/',
  validationSerie,
  sanitizeSerie,
  requireAuthentication,
  ensureAdmin,
  catchErrors(newSeries),
);
