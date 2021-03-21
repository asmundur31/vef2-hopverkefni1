/* eslint-disable no-underscore-dangle */
import express from 'express';
import pkg from 'express-validator';
import multer from 'multer';

import { catchErrors } from '../utils.js';
import { selectSeriesPaging, selectCountSeries, insertSerieWithImage } from '../db.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { validationSerie, sanitizeSerie, validateImage } from '../validation.js';

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

  const fullUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

  const links = {
    _links: {
      self: {
        href: `${fullUrl}/?offset=${offset}&limit=${limit}`,
      },
    },
  };

  if (offset > 0) {
    links._links.prev = {
      href: `${fullUrl}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  // eslint-disable-next-line eqeqeq
  if (answer.length == limit && offset + limit != count) {
    links._links.next = {
      href: `${fullUrl}/?offset=${Number(offset) + limit}&limit=${limit}`,
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
  const errors = validationResult(req);
  if (!errors.isEmpty() || req.imageError) {
    if (req.imageError) {
      errors.errors.push(req.imageError);
    }
    return res.status(400).json(errors);
  }
  const {
    name,
    airDate,
    inProduction,
    tagline,
    description,
    language,
    network,
    url,
  } = req.body;

  const data = {
    name,
    airDate,
    inProduction,
    tagline,
    description,
    language,
    network,
    url,
  };
  const image = req.file;

  const answer = await insertSerieWithImage(data, image);
  if (!answer) {
    return res.status(400).json({ error: 'Gögn brjóta gegn gildum sem eru í gagnagrunni' });
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
  requireAuthentication,
  ensureAdmin,
  upload.single('image'),
  validateImage,
  validationSerie,
  sanitizeSerie,
  catchErrors(newSeries),
);
