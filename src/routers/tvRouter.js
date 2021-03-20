/* eslint-disable no-underscore-dangle */
import express from 'express';

import { catchErrors } from '../utils.js';
import { selectSeriesPaging, selectCountSeries } from '../db.js';

export const router = express.Router({ mergeParams: true });

async function getSeries(req, res) {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const answer = await selectSeriesPaging(offset, limit);

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

function newSeries(req, res) {
  // Tökum við gögnum og vistum í gagnagrunn
  // Skilum síðan nýju seríunni
  const newData = {
    newSeries: 'Hér kemur ný series',
  };
  return res.json(newData);
}

// skilar síðum af sjónvarps seríum með grunnupplýsingum
router.get('/', catchErrors(getSeries));
// býr til nýja sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post('/', catchErrors(newSeries));
