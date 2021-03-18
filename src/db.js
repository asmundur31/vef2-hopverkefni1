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
 *
 * @param {array} data Fylki af gögnum fyrir umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insertSerie(data) {
  const q = 'INSERT INTO series(id, name, air_date, in_production, tagline, image, description, language, network, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
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

/* export async function insertSeason(data) {
  const q = 'INSERT INTO series(
      name, number, air_date, overview, poster, serie_id) VALUES ($1, $2, $3, $4, $5, $6)';
  const values = [
    data.name,
    data.number,
    data.airDate,
    data.overview,
    data.poster,
    data.serieId,
  ];

  return query(q, values);
} */
//
/* export async function insertEpisode(data) {
  const q = 'INSERT INTO series(
      name, number, air_date, overview, season_id) VALUES ($1, $2, $3, $4, $5)';
  const values = [
    data.name,
    data.number,
    data.airDate,
    data.overview,
    data.season,
  ];

  return query(q, values);
} */

/**
 * Sækir allar undirskriftir
 *
 * @returns {array} Fylki af öllum umsóknum
 */
/* export async function select() {
  const result = await query('SELECT * FROM signatures ORDER BY id');

  return result.rows;
} */

export async function end() {
  await pool.end();
}
