import express from 'express';

export const router = express.Router({ mergeParams: true });

function getAllSeasons(req, res) {
  const { seriesId } = req.params;
  const allSeasons = {
    oneSeries: `Hér koma öll season fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(allSeasons);
}

function getOneSeasons(req, res) {
  const { seriesId, seasonId } = req.params;
  const oneSeason = {
    oneSeason: `Hér kemur season með seasonId = ${seasonId} fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(oneSeason);
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
    delete: `Eyðum season með seasonId = ${seasonId} fyrir seríu með seriesId = ${seriesId}`,
  };
  return res.json(deletedSeason);
}

// skilar fylki af öllum seasons fyrir sjónvarps seríu
router.get('/', getAllSeasons);
// býr til nýtt í season í sjónvarps seríu, aðeins ef notandi er stjórnandi
router.post('/', createSeason);
// skilar stöku season fyrir þátt með grunnupplýsingum, fylki af þáttum
router.get('/:seasonId', getOneSeasons);
// eyðir season, aðeins ef notandi er stjórnandi
router.delete('/:seasonId', deleteSeason);
