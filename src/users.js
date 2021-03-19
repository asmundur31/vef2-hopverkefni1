import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  const client = await pool.connect();

  let result;

  try {
    result = await client.query(q, values);
  } catch (err) {
    console.error('Villa í query', err);
    throw err;
  } finally {
    client.release();
  }

  return result;
}

export async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

export async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  try {
    const result = await query(q, [username]);
    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir notendnafni');
    return null;
  }

  return false;
}

export async function findByEmail(email) {
  const q = 'SELECT * FROM users WHERE email = $1';

  try {
    const result = await query(q, [email]);
    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir netfangi');
    return null;
  }

  return false;
}

export async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  try {
    const result = await query(q, [id]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir id');
  }

  return null;
}

/**
 * Fall sem athugar hvort notandi sé til og vistar nýjan notanda í gagnagrunn ef hann er ekki til
 * @param {string} username notendanafn
 * @param {string} email netfang
 * @param {string} password lykilorð
 */
export async function createNewUser(username, email, password) {
  // Athugum hvort notandi er til
  // Það er athugað í validationRegister er það nóg?
  // Það er líka búið að sanitize-a gögnin og xss-sanitize-a
  const q = 'INSERT INTO users(username, email, password, admin) VALUES ($1, $2, $3, $4) RETURNING *;';
  try {
    const hashedPassword = await bcrypt.hash(password, 11);
    const result = await query(q, [username, email, hashedPassword, false]);
    if (result.rowCount === 1) {
      // Fjarlægjum lykilorðið
      delete result.rows[0].password;
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki sett inn nýjan notanda');
    return null;
  }

  return false;
}
