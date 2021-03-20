import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

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
  const q = 'INSERT INTO series(id, name, air_date, in_production, tagline, image, description, language, network, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
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
  return query(q, values);
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
  const values = [data];
  return query(q, values);
}

/**
 * Bætir við season
 * (/tv/:id/season/ POST og að bæta við gögnum úr csv)
 *
 * @param {} data gögn fyrir season
 * @returns fyrirspurn
 */
export async function insertSeason(data) {
  const q = 'INSERT INTO seasons(name, number, air_date, overview, poster, serie_id) VALUES ($1, $2, $3, $4, $5, $6)';
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

  return query(q, values);
}

/**
 * Bætir við episode
 * (/tv/:id/season/:id/episode/ POST og bæta gögnum úr csv)
 *
 * @param {} data gögn fyrir episode
 * @returns fyrirspurn
 */
export async function insertEpisode(data) {
  const q = 'INSERT INTO episodes(name, number, air_date, overview, season_number, series_id) VALUES ($1, $2, $3, $4, $5, $6)';
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

  return query(q, values);
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
  return answer.rows;
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
export async function selectGenres() {
  const q = 'SELECT name FROM genres';
  const answer = await query(q);
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
 * Sækir seasons eftir seriesId með paging
 * (Fyrir /tv/:id/season/ GET)
 */
export async function selectSeasonsPaging(offset = 0, limit = 10, seriesId) {
  const q = 'SELECT * FROM seasons WHERE serie_id=$1 ORDER BY id OFFSET $2 LIMIT $3';
  const result = await query(q, [seriesId, offset, limit]);

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
 * Eyðir episode eftir number, season_number og series_id
 * (Fyrir /tv/:id/season/:id/episode/:id DELETE)
 */
export async function deleteEpisode(number, seasonNumber, seriesId) {
  const q = 'DELETE FROM episodes WHERE number=$1 AND season_number=$2 AND series_id =$3';
  const data = [
    number,
    seasonNumber,
    seriesId,
  ];
  return query(q, data);
}

export async function end() {
  await pool.end();
}
