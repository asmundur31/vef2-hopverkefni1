import express from 'express';

import { catchErrors } from '../utils.js';
import { requireAuthentication, ensureAdmin } from '../authentication.js';
import { deleteEpisodesInSeries, deleteSeasonsInSeries, deleteSeries } from '../db.js';

export const router = express.Router({ mergeParams: true });

function getOneSeries(req, res) {
  const { seriesId } = req.params;
  const oneSeries = {
    oneSeries: `Beðið var um seríu með seriesId = ${seriesId}`,
  };
  return res.json(oneSeries);
}

function updateSeries(req, res) {
  const { seriesId } = req.params;
  const updatedSeries = {
    updateSeries: `Uppfærum seríu með seriesId = ${seriesId}`,
  };
  return res.json(updatedSeries);
}

async function deleteSeriesR(req, res) {
  const { seriesId } = req.params;

  // Eyðum fyrst þáttum í seríu
  const answerE = await deleteEpisodesInSeries(seriesId);
  if (!answerE) {
    return res.json({ error: 'Ekki tókst að eyða þátttum' });
  }

  // Næst eyðum við seasons í seríu
  const answerSeason = await deleteSeasonsInSeries(seriesId);
  if (!answerSeason) {
    return res.json({ error: 'Ekki tókst að eyða þáttaröðum' });
  }

  // Eyðum loks seríu
  const answerSerie = await deleteSeries(seriesId);
  if (!answerSerie) {
    return res.json({ error: 'Ekki tókst að eyða sjónvarpsþætti' });
  }

  const deletedSeries = {
    delete: `Eyðum seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedSeries);
}

function newRating(req, res) {
  const { seriesId } = req.params;
  const rating = {
    rating: `Ný einkunn frá innskráðum notanda gefin seríu með seriesId = ${seriesId}`,
  };
  return res.json(rating);
}

function updateRating(req, res) {
  const { seriesId } = req.params;
  const rating = {
    rating: `Einkunn uppfærð fyrir innskráðan notanda fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(rating);
}

function deleteRating(req, res) {
  const { seriesId } = req.params;
  const deletedRating = {
    delete: `Einkunn eytt fyrir innskráðan notanda fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedRating);
}

function newState(req, res) {
  const { seriesId } = req.params;
  const state = {
    state: `Ný staða frá innskráðum notanda gefin seríu með seriesId = ${seriesId}`,
  };
  return res.json(state);
}

function updateState(req, res) {
  const { seriesId } = req.params;
  const state = {
    state: `Staða uppfærð fyrir innskráðan notanda fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(state);
}

function deleteState(req, res) {
  const { seriesId } = req.params;
  const deletedState = {
    delete: `Stöðu eytt fyrir innskráðan notanda fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedState);
}

// skilar einni sjónvarps seríu með seriesId
// Ef notandi er innskráður skal sýna einkunn og stöðu viðkomandi á sjónvarps seríu.
router.get('/', getOneSeries);
// uppfærir sjónvarps seríu, reit fyrir reit, aðeins ef notandi er stjórnandi
router.patch('/', updateSeries);
// eyðir sjónvarps seríu, aðeins ef notandi er stjórnandi
router.delete(
  '/',
  requireAuthentication,
  ensureAdmin,
  catchErrors(deleteSeriesR),
);
// skráir einkunn innskráðs notanda á sjónvarps seríu, aðeins fyrir innskráða notendur
router.post('/rate', newRating);
// uppfærir einkunn innskráðs notanda á sjónvarps seríu
router.patch('/rate', updateRating);
// eyðir einkunn innskráðs notanda á sjónvarps seríu
router.delete('/rate', deleteRating);
// skráir stöðu innskráðs notanda á sjónvarps seríu, aðeins fyrir innskráða notendur
router.post('/state', newState);
// uppfærir stöðu innskráðs notanda á sjónvarps seríu
router.patch('/state', updateState);
// eyðir stöðu innskráðs notanda á sjónvarps seríu
router.delete('/state', deleteState);
