import pg from 'pg';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}
// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }
  return null;
}

/**
 * Bætir við serie.
 * (Bæta við gögnum úr csv og /tv POST)
 *
 * @param {array} data Fylki af gögnum fyrir umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insertSerie(data) {
  const q = 'INSERT INTO series(id, name, air_date, in_production, tagline, image, description, language, network, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id';
  if (data.airDate === '') {
    // eslint-disable-next-line no-param-reassign
    data.airDate = null;
  }
  const values = [
    data.id,
    data.name,
    data.airDate,
    data.inProduction,
    data.tagline,
    data.image,
    data.description,
    data.language,
    data.network,
    data.homepage,
  ];
  const answer = await query(q, values);
  return answer;
}

/**
 * Eyðir series eftir id
 * (/tv/:id DELETE)
 *
 * @param {*} data id á series
 * @returns fyrirspurn
 */
export async function deleteSeries(data) {
  const q = 'DELETE FROM series WHERE id=$1';
  const answer = await query(q, [data]);
  return answer;
}

/**
 * Bætir við season
 * (/tv/:id/season/ POST og að bæta við gögnum úr csv)
 *
 * @param {} data gögn fyrir season
 * @returns fyrirspurn
 */
export async function insertSeason(data) {
  const q = 'INSERT INTO seasons(name, number, air_date, overview, poster, serie_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
  if (data.airDate === '') {
    // eslint-disable-next-line no-param-reassign
    data.airDate = null;
  }
  const values = [
    data.name,
    data.number,
    data.airDate,
    data.overview,
    data.poster,
    data.serieId,
  ];

  const answer = await query(q, values);
  return answer;
}

/**
 * Eyðir season eftir season_number og series_id
 * (Fyrir /tv/:id/season/:id DELETE)
 */
export async function deleteSeason(seasonNumber, seriesId) {
  const q = 'DELETE FROM seasons WHERE number=$1 AND serie_id =$2 RETURNING id';
  const data = [
    seasonNumber,
    seriesId,
  ];
  const answer = await query(q, data);
  return answer;
}

/**
 * Eyðir seasons í seríu eftir series_id
 */
export async function deleteSeasonsInSeries(seriesId) {
  const q = 'DELETE FROM seasons WHERE serie_id =$1 RETURNING id';
  const data = [
    seriesId,
  ];
  const answer = await query(q, data);
  return answer;
}

/**
 * Bætir við episode
 * (/tv/:id/season/:id/episode/ POST og bæta gögnum úr csv)
 *
 * @param {} data gögn fyrir episode
 * @returns fyrirspurn
 */
export async function insertEpisode(data) {
  const q = 'INSERT INTO episodes(name, number, air_date, overview, season_number, series_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
  if (data.airDate === '') {
    // eslint-disable-next-line no-param-reassign
    data.airDate = null;
  }
  const values = [
    data.name,
    data.number,
    data.airDate,
    data.overview,
    data.season,
    data.serieId,
  ];

  const answer = await query(q, values);
  return answer;
}

/**
 * Bætir við genres
 * (/genres POST og csv gögn)
 * @param {} data heiti á genre
 * @returns id á dálki sem var insertað í
 */
export async function insertGenres(data) {
  const q = 'INSERT INTO genres(name) VALUES ($1) RETURNING id';
  const answer = await query(q, [data]);
  return answer;
}

/**
 * Sækir id á genre eftir nafni
 * @param {*} data nafn á genre
 * @returns skilar id
 */
export async function selectGenreId(data) {
  const q = 'SELECT id FROM genres WHERE name = $1';
  const answer = await query(q, [data.toString()]);
  return answer.rows;
}

/**
 * Sækir nöfn á öll genres
 * (/genres GET)
 */
export async function selectGenresPaging(offset = 0, limit = 10) {
  const q = 'SELECT name FROM genres ORDER BY id OFFSET $1 LIMIT $2';
  const answer = await query(q, [offset, limit]);
  return answer.rows;
}

/**
 * Bætir við series_genres
 * @param {*} idSeries id á series
 * @param {*} idGenres id á gernes
 * @returns fyrirspurn
 */
export async function insertSeriesGenres(idSeries, idGenres) {
  const q = 'INSERT INTO series_genres(serie_id, genre_id) VALUES ($1, $2)';
  const values = [
    idSeries,
    idGenres,
  ];
  return query(q, values);
}

/**
 * Uppfærum slóð á image í series
 * @param {*} newImage nýja url
 * @param {*} oldImage gamla file
 * @returns fyrirspurn
 */
export async function updateImageFromSeries(newImage, oldImage) {
  const q = 'UPDATE series SET image=$1 WHERE image=$2';
  return query(q, [newImage, oldImage]);
}

/**
 * Athuga hvort að mynd sé til í series
 * @param {*} data slóð/nafn á image
 * @returns skilar true ef mynd er í töflu annars false
 */
export async function imageExistsInSeries(data) {
  const q = 'SELECT EXISTS(SELECT 1 FROM series WHERE image = $1);';
  const answer = await query(q, [data]);
  return answer.rows;
}

/**
 * Uppfærum poster í season
 * @param {*} newImage nýja url
 * @param {*} oldImage gamla file name
 * @returns fyrirspurn
 */
export async function updatePosterFromSeasons(newImage, oldImage) {
  const q = 'UPDATE seasons SET poster=$1 WHERE poster=$2';
  return query(q, [newImage, oldImage]);
}

/**
 * Sækir allar series með paging
 * (Fyrir /tv GET)
 */
export async function selectSeriesPaging(offset = 0, limit = 10) {
  const q = 'SELECT * FROM series ORDER BY id OFFSET $1 LIMIT $2';
  const result = await query(q, [offset, limit]);

  return result.rows;
}

/**
 * Sækir eina series
 * (Fyrir /tv/:seriesId GET)
 */
export async function getSeriesOne(seriesId) {
  let q = 'SELECT * FROM series WHERE id = $1';
  let result = await query(q, [seriesId]);
  const series = result.rows[0];

  // Bætum við meðaleinkunn, fjölda einkunna, genres, seasons
  q = 'SELECT AVG(rate) FROM users_series WHERE serie_id = $1';
  result = await query(q, [seriesId]);
  const average = result.rows[0];
  series.averagerating = Number(average.avg).toPrecision(2);

  q = 'SELECT COUNT(rate) FROM users_series WHERE serie_id = $1';
  result = await query(q, [seriesId]);
  const count = result.rows[0];
  series.ratingcount = count.count;

  q = 'SELECT name FROM genres JOIN series_genres ON genre_id = genres.id WHERE serie_id = $1';
  result = await query(q, [seriesId]);
  const genres = result.rows;
  series.genres = genres;

  q = 'SELECT name, number, air_date, overview, poster FROM seasons WHERE serie_id = $1 ORDER bY number';
  result = await query(q, [seriesId]);
  const seasons = result.rows;
  series.seasons = seasons;

  return series;
}

/**
 * Uppfærir eina series
 * (Fyrir /tv/:seriesId PATCH)
 */
export async function seriesUpdate(seriesId, data, image) {
  let q;
  let result;
  if (data.name) {
    q = 'UPDATE series SET name=$1 WHERE id=$2';
    result = await query(q, [data.name, seriesId]);
  }
  if (data.air_date) {
    q = 'UPDATE series SET air_date=$1 WHERE id=$2';
    const date = Date(data.air_date);
    result = await query(q, [date, seriesId]);
  }
  if (data.in_production === 'false' || data.in_production === 'true') {
    q = 'UPDATE series SET in_production=$1 WHERE id=$2';
    result = await query(q, [data.in_production, seriesId]);
  }
  if (data.tagline) {
    q = 'UPDATE series SET tagline=$1 WHERE id=$2';
    result = await query(q, [data.tagline, seriesId]);
  }
  if (image) {
    q = 'UPDATE series SET image=$1 WHERE id=$2';
    const answer = await cloudinary.v2.uploader.upload(image.path);
    result = await query(q, [answer.secure_url, seriesId]);
  }
  if (data.description) {
    q = 'UPDATE series SET description=$1 WHERE id=$2';
    result = await query(q, [data.description, seriesId]);
  }
  if (data.language) {
    q = 'UPDATE series SET language=$1 WHERE id=$2';
    result = await query(q, [data.language, seriesId]);
  }
  if (data.newtwork) {
    q = 'UPDATE series SET newtwork=$1 WHERE id=$2';
    result = await query(q, [data.newtwork, seriesId]);
  }
  if (data.url) {
    q = 'UPDATE series SET url=$1 WHERE id=$2';
    result = await query(q, [data.url, seriesId]);
  }
  q = 'SELECT * FROM series WHERE id=$1';
  result = await query(q, [seriesId]);
  return result.rows[0];
}

/**
 * Sækir seasons eftir seriesId með paging
 * (Fyrir /tv/:id/season/ GET)
 */
export async function selectSeasonsPaging(seriesId, offset = 0, limit = 10) {
  const q = 'SELECT * FROM seasons WHERE serie_id=$1 ORDER BY id OFFSET $2 LIMIT $3';
  const result = await query(q, [seriesId, offset, limit]);

  return result.rows;
}

/**
 * Sækir eitt season eftir seriesId og seasonNumber
 * (Fyrir /tv/:id/season/ GET)
 */
export async function selectSeason(seriesId, seasonNumber) {
  const q = 'SELECT * FROM seasons WHERE serie_id=$1 AND number=$2;';
  const result = await query(q, [seriesId, seasonNumber]);

  return result.rows;
}

/**
 * Sækir episode eftir number, season_number og series_id
 * (Fyrir /tv/:id/season/:id/episode/:id GET)
 */
export async function selectEpisode(number, seasonNumber, seriesId) {
  const q = 'SELECT * FROM episodes WHERE number=$1 AND season_number=$2 AND series_id =$3';
  const data = [
    number,
    seasonNumber,
    seriesId,
  ];
  const result = await query(q, data);
  return result.rows;
}

/**
 * Sækir alla episodes í einu season eftir season_number og series_id
 * (Fyrir /tv/:id/season/:id/episode/:id GET)
 */
export async function selectEpisodes(seasonNumber, seriesId) {
  const q = 'SELECT * FROM episodes WHERE season_number=$1 AND series_id =$2';
  const data = [
    seasonNumber,
    seriesId,
  ];
  const result = await query(q, data);
  return result.rows;
}

/**
 * Eyðir episode eftir number, season_number og series_id
 * (Fyrir /tv/:id/season/:id/episode/:id DELETE)
 */
export async function deleteEpisode(number, seasonNumber, seriesId) {
  const q = 'DELETE FROM episodes WHERE number=$1 AND season_number=$2 AND series_id =$3 RETURNING id';
  const data = [
    number,
    seasonNumber,
    seriesId,
  ];
  const answer = await query(q, data);
  return answer;
}

/**
 * Eyðir episodes í season eftir season_number og series_id
 * (Fyrir /tv/:id/season/:id/ DELETE)
 */
export async function deleteEpisodesInSeason(seasonNumber, seriesId) {
  const q = 'DELETE FROM episodes WHERE season_number=$1 AND series_id =$2 RETURNING id';
  const data = [
    seasonNumber,
    seriesId,
  ];
  const answer = await query(q, data);
  return answer;
}

/**
 * Eyðir episodes í season eftir season_number og series_id
 * (Fyrir /tv/:id/season/:id/ DELETE)
 */
export async function deleteEpisodesInSeries(seriesId) {
  const q = 'DELETE FROM episodes WHERE series_id =$1 RETURNING id';
  const data = [
    seriesId,
  ];
  const answer = await query(q, data);
  return answer;
}

export async function selectCountSeries() {
  const q = 'SELECT COUNT(*) AS count FROM series';
  const result = await query(q);

  return result.rows[0].count;
}

export async function selectCountSeasons() {
  const q = 'SELECT COUNT(*) AS count FROM seasons';
  const result = await query(q);

  return result.rows[0].count;
}

export async function selectCountGenres() {
  const q = 'SELECT COUNT(*) AS count FROM genres';
  const result = await query(q);

  return result.rows[0].count;
}

export async function getRatingStatus(userId, seriesId) {
  const q = 'SELECT * FROM users_series WHERE user_id = $1 AND serie_id = $2';
  const result = await query(q, [userId, seriesId]);

  return result.rows[0];
}

export async function end() {
  await pool.end();
}
