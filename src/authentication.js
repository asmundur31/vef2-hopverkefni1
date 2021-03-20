import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  findById,
  findByUsername,
  comparePasswords,
} from './users.js';

dotenv.config();

const {
  JWT_SECRET: jwtSecret,
  JWT_LIFETIME: tokenLifetime = 36000,
} = process.env;

if (!jwtSecret) {
  console.error('Vantar JWT_SECRET .env gildi');
  process.exit(1);
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

async function strat(data, next) {
  // fáum id gegnum data sem geymt er í token
  const user = await findById(data.id);

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

// Notum local strategy með „strattinu“ okkar til að leita að notanda
passport.use(new Strategy(jwtOptions, strat));

export default passport;

/**
 * Fall sem sér um að innskrá notanda
 * @param {String} username Notendanafn notenda
 * @param {String} password Lykilorð notanda
 * @returns skilar notanda ef innskráning gengur upp annars false
 */
export async function login(username, password) {
  const exists = await findByUsername(username);

  if (!exists) {
    return false;
  }

  const passwordIsCorrect = await comparePasswords(password, exists.password);

  if (passwordIsCorrect) {
    const payload = { id: exists.id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    // Fjarlægjum lykilorðið
    delete exists.password;
    const user = {
      user: exists,
      token,
      expiresIn: tokenLifetime,
    };
    return user;
  }

  return false;
}

export function requireAuthentication(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error = info.name === 'TokenExpiredError'
          ? 'expired token' : 'invalid token';

        return res.status(401).json({ error });
      }

      // Látum notanda vera aðgengilegan í rest af middlewares
      req.user = user;
      return next();
    },
  )(req, res, next);
}

/**
 * Fall sem athugar hvort innskráður notandi sé admin
 * @param {Object} req Request hluturinn
 * @param {Object} res Response hluturinn
 * @param {function} next fallið sem er kallað næst í
 */
export function ensureAdmin(req, res, next) {
  if (req.user.admin) {
    return next();
  }
  return res.json({ error: 'Ófullnægjandi réttindi' });
}
