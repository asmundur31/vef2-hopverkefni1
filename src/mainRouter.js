import express from 'express';

import { catchErrors } from './utils.js';

export const router = express.Router();

async function allAvailable(req, res) {
  const tv = {};
  const seasons = {};
  const episodes = {};
  const genres = {};
  const users = {};

  const all = {
    tv,
    seasons,
    episodes,
    genres,
    users,
  };
  return res.json(all);
}

router.get('/', catchErrors(allAvailable));