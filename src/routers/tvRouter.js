import express from 'express';

import { catchErrors } from '../utils.js';

export const router = express.Router({ mergeParams: true });

function getSeries(req, res) {
  const series = {
    Series: 'Hér koma allar series',
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
router.get('/', getSeries);
// býr til nýja sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post('/', newSeries);
