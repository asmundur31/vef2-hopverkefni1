import bcrypt from 'bcrypt';

import { query } from './db.js';

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

export async function getAllUsers() {
  const q = 'SELECT * FROM users;';

  try {
    const result = await query(q);
    if (result.rowCount > 0) {
      const users = [];
      for (let i = 0; i < result.rowCount; i++) {
        const user = result.rows[i];
        // Fjarlægjum lykilorðið
        delete user.password;
        users.push(user);
      }
      return users;
    }
  } catch (e) {
    console.error('Gat ekki fundið notendur');
    return null;
  }
  return false;
}

export async function updateUserAdmin(userId, admin) {
  const q = 'UPDATE users SET admin = $1, updated = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;';
  try {
    const result = await query(q, [admin, userId]);
    if (result.rowCount === 1) {
      // Fjarlægjum lykilorðið
      delete result.rows[0].password;
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki uppfært notanda');
    return null;
  }

  return false;
}

export async function updateUserMe(user, newEmail, newPassword) {
  if (newEmail) {
    const q = 'UPDATE users SET email = $1 WHERE id = $2;';
    try {
      await query(q, [newEmail, user.id]);
    } catch (e) {
      console.error('Gat ekki uppfært notanda');
      return null;
    }
  }
  if (newPassword) {
    const q = 'UPDATE users SET password = $1 WHERE id = $2;';
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 11);
      await query(q, [hashedPassword, user.id]);
    } catch (e) {
      console.error('Gat ekki uppfært notanda');
      return null;
    }
  }

  // Uppfærum síðan updated og sækjum userinn
  const q = 'UPDATE users SET updated = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;';
  try {
    const result = await query(q, [user.id]);
    if (result.rowCount === 1) {
      // Fjarlægjum lykilorðið
      delete result.rows[0].password;
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki sótt notanda eftir að uppfærslu lauk');
    return null;
  }

  return false;
}

export async function newRating(userId, seriesId, rating) {
  const q = 'INSERT INTO users_series (serie_id, user_id, rate) VALUES ($1, $2, $3) RETURNING *;';
  const result = await query(q, [seriesId, userId, rating]);
  const rate = result.rows[0];
  return rate;
}

export async function updateRating(userId, seriesId, rating = null) {
  let q;
  let result;
  if (rating) {
    q = 'UPDATE users_series SET rate = $1 WHERE user_id = $2 AND serie_id = $3 RETURNING *';
    result = await query(q, [rating, userId, seriesId]);
  } else {
    q = 'UPDATE users_series SET rate = null WHERE user_id = $1 AND serie_id = $2 RETURNING *';
    result = await query(q, [userId, seriesId]);
  }
  const rate = result.rows[0];
  return rate;
}

export async function newState(userId, seriesId, state) {
  const q = 'INSERT INTO users_series (serie_id, user_id, state) VALUES ($1, $2, $3) RETURNING *;';
  const result = await query(q, [seriesId, userId, state]);
  const stateNew = result.rows[0];
  return stateNew;
}

export async function stateUpdate(userId, seriesId, state = null) {
  let q;
  let result;
  if (state) {
    q = 'UPDATE users_series SET state = $1 WHERE user_id = $2 AND serie_id = $3 RETURNING *';
    result = await query(q, [state, userId, seriesId]);
  } else {
    q = 'UPDATE users_series SET state = null WHERE user_id = $1 AND serie_id = $2 RETURNING *';
    result = await query(q, [userId, seriesId]);
  }
  const updatedState = result.rows[0];
  return updatedState;
}
