import express from 'express';

export const router = express.Router();

function allGenres(req, res) {
  const genres = {
    allGenres: `Hér eiga að koma öll genres`,
  };
  return res.json(genres);
}

function newGenre(req, res) {
  const genres = {
    newGenre: `Búum til nýtt genre`,
  };
  return res.json(genres);
}

// skilar síðu af tegundum (genres)
router.get('/', allGenres);
// býr til tegund, aðeins ef notandi er stjórnandi
router.post('/', newGenre);
