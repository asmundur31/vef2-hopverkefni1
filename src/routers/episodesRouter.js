import express from 'express';

export const router = express.Router({ mergeParams: true });

function newEpisode(req, res) {
  const { seriesId, seasonId } = req.params;
  const episode = {
    episode: `Nýr þáttur búinn til fyrir season með seasonId = ${seasonId} og seríu með seriesId = ${seriesId}`,
  };
  return res.json(episode);
}

function getEpisode(req, res) {
  const { seriesId, seasonId, episodeId } = req.params;
  const episode = {
    episode: `Hér kemur þáttur með episodeId = ${episodeId}, seasonId = ${seasonId} og seriesId = ${seriesId}`,
  };
  return res.json(episode);
}

function deleteEpisode(req, res) {
  const { seriesId, seasonId, episodeId } = req.params;
  const episode = {
    delete: `Eyðum þátt með episodeId = ${episodeId}, seasonId = ${seasonId} og seriesId = ${seriesId}`,
  };
  return res.json(episode);
}

// býr til nýjan þátt í season, aðeins ef notandi er stjórnandi
router.post('/', newEpisode);
// skilar upplýsingum um þátt
router.get('/:episodeId', getEpisode);
// eyðir þætti, aðeins ef notandi er stjórnandi
router.delete('/:episodeId', deleteEpisode);
