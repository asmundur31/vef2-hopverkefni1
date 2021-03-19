import express from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';

import { login, requireAuthentication } from '../authentication.js';
import {
  findByUsername,
  findByEmail,
  comparePasswords,
  createNewUser,
} from '../users.js';
import { catchErrors } from '../utils.js';

export const router = express.Router();

function allUsers(req, res) {
  const users = {
    allUsers: `Hér eiga að koma allir users`,
  };
  return res.json(users);
}

async function registerUser(req, res) {
  const { username, email, password } = req.body;
  const user = await createNewUser(username, email, password);
  if (!user) {
    const errors = validationResult(req);
    return res.status(401).json(errors);
  }
  return res.json(user);
}

/**
 * Fall sem loggar notanda inn með username og password
 * @param {Object} req Request hluturinn
 * @param {Object} res Response hluturinn
 * @returns Notanda sem var að innskrá sig ef það gekk upp
 */
async function loginUser(req, res) {
  const { username, password = '' } = req.body;
  const user = await login(username, password);
  if (!user) {
    const errors = validationResult(req);
    return res.status(401).json(errors);
  }
  return res.json(user);
}

/**
 * Fall sem sýnir upplýsingar um innskráðan notanda aðeins ef hann er innskráður
 * @param {Object} req Request hluturinn
 * @param {Object} res Response hluturinn
 * @returns Skilar notanda ef hann er innskráður
 */
function loggedInUser(req, res) {
  const { user } = req;
  // Fjarlægjum lykilorðið
  delete user.password;
  return res.json(user);
}

function updateLoggedInUser(req, res) {
  const user = {
    user: `Uppfærum innskráðan notanda`,
  };
  return res.json(user);
}

function oneUser(req, res) {
  const { userId } = req.params;
  const user = {
    oneUsers: `Hér kemur user með userId = ${userId}`,
  };
  return res.json(user);
}

function updateUser(req, res) {
  const { userId } = req.params;
  const user = {
    update: `Uppfærum user með userId = ${userId}`,
  };
  return res.json(user);
}

const validationLogin = [
  body('username')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('username')
    .custom(async (value, { req }) => {
      // Athugum hvort notandi sé til og hefur rétt lykilorð
      const exists = await findByUsername(req.username);
      if (!exists) {
        return Promise.reject();
      }
      const passwordIsCorrect = await comparePasswords(req.password, exists.password);
      if (passwordIsCorrect) {
        return true;
      }
      return Promise.reject();
    })
    .withMessage('Notendanafn eða lykilorð er rangt'),
  body('password')
    .isLength({ min: 10, max: 256 })
    .withMessage('Lykilorð verður að vera a.m.k 10 stafir og hámarki 256 stafir'),
];

const validationRegister = [
  body('username')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('username')
    .custom(async (value) => {
      // Athugum hvort notendanafn er frátekið
      const user = await findByUsername(value);
      if (user) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Notandanafn er frátekið'),
  body('password')
    .isLength({ min: 10, max: 256 })
    .withMessage('Lykilorð verður að vera a.m.k 10 stafir og hámarki 256 stafir'),
  body('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),
  body('email')
    .isEmail()
    .withMessage('Netfang verður að vera gilt netfang'),
  body('email')
    .custom(async (value) => {
      // Athugum hvort netfang er frátekið
      const user = await findByEmail(value);
      if (user) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Netfang er frátekið'),
];

// Viljum keyra sér og með validation, ver gegn „self XSS“
const xssSanitizationMiddleware = [
  body('username').customSanitizer((v) => xss(v)),
  body('email').customSanitizer((v) => xss(v)),
  body('password').customSanitizer((v) => xss(v)),
];

// Listi af hreinsun á gögnum
const sanitize = [
  body('username').trim().escape(),
  body('email').normalizeEmail(),
  body('password').trim().escape(),
];

// skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
router.get('/', allUsers);
/*
staðfestir og býr til notanda. Skilar auðkenni og netfangi. Notandi sem búinn er til skal
aldrei vera stjórnandi
*/
router.post(
  '/register',
  validationRegister,
  xssSanitizationMiddleware,
  sanitize,
  catchErrors(registerUser),
);
// með netfangi og lykilorði skilar token ef gögn rétt
router.post(
  '/login',
  validationLogin,
  xssSanitizationMiddleware,
  catchErrors(loginUser),
);
// skilar upplýsingum um notanda sem á token, auðkenni og netfangi, aðeins ef notandi innskráður
router.get('/me', requireAuthentication, loggedInUser);
// uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður
router.patch('/me', updateLoggedInUser);
// skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi
router.get('/:userId', oneUser);
/*
breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi
og er ekki að breyta sér sjálfum
*/
router.patch('/:userId', updateUser);

// Aldrei skal skila eða sýna hash fyrir lykilorð.
