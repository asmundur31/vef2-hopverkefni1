/* eslint-disable no-underscore-dangle */
import express from 'express';
import pkg from 'express-validator';
import { selectGenresPaging, selectCountGenres, insertGenres } from '../db.js';
import { catchErrors } from '../utils.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { validationGenre, sanitizeGenre } from '../validation.js';

const { validationResult } = pkg;
export const router = express.Router();

async function allGenres(req, res) {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const answer = await selectGenresPaging(offset, limit);
  if (!answer) {
    // Númer á villu?
    return res.json({ error: 'Ekki tókst að ná í sjónvarpsþáttategundir' });
  }

  if (answer.length === 0) {
    return res.status(404).json({ error: 'Engar sjónvarpsþáttategundir á þessu bili' });
  }

  const count = await selectCountGenres();

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

  const genres = {
    limit,
    offset,
    items: answer,
    links,
  };
  return res.json(genres);
}

async function newGenre(req, res) {
  const { name } = req.body;

  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    const errors = validation.array();
    return res.status(400).json(errors);
  }

  const result = await insertGenres(name);
  if (!result) {
    return res.status(400).json({ error: 'Þessi sjónvarpsþáttategund er þegar til' });
  }

  const genres = {
    newGenre: `Tókst að bæta við nýrri sjónvarpsþáttartegund með id=${result}`,
  };
  return res.json(genres);
}

// skilar síðu af tegundum (genres)
router.get('/', catchErrors(allGenres));

// býr til tegund, aðeins ef notandi er stjórnandi
router.post(
  '/',
  validationGenre,
  sanitizeGenre,
  requireAuthentication,
  ensureAdmin,
  catchErrors(newGenre),
);
