import express from 'express';
import pkg from 'express-validator';

import {
  login,
  requireAuthentication,
  ensureAdmin,
} from '../authentication.js';
import {
  createNewUser,
  findById,
  getAllUsers,
  updateUserAdmin,
  updateUserMe,
} from '../users.js';
import {
  validationLogin,
  validationRegister,
  validationUpdateAdmin,
  validationUpdate,
  validationGetUser,
  xssSanitizationMiddleware,
  sanitize,
} from '../validation.js';
import { catchErrors } from '../utils.js';

const { validationResult } = pkg;

export const router = express.Router();

async function allUsers(req, res) {
  const users = await getAllUsers();
  return res.json(users);
}

/**
 * Fallið sem kallað er í til að búa til nýjan notanda
 * @param {Object} req Request hluturinn
 * @param {Object} res Response hluturinn
 * @returns skilar annaðhvort usernum sem var verið að búa til eða errors
 */
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

async function updateLoggedInUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json(errors);
  }
  const { email = '', password = '' } = req.body;
  const user = await updateUserMe(req.user, email, password);
  return res.json(user);
}

async function oneUser(req, res) {
  const { userId } = req.params;
  const user = await findById(userId);
  if (user) {
    // Fjarlægjum lykilorð
    delete user.password;
    return res.json(user);
  }
  const errors = validationResult(req);
  return res.status(404).json(errors);
}

async function updateUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json(errors);
  }
  const { userId } = req.params;
  const { admin } = req.body;
  const user = await updateUserAdmin(userId, admin);
  return res.json(user);
}

// skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
router.get(
  '/',
  requireAuthentication,
  ensureAdmin,
  catchErrors(allUsers),
);
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
router.get(
  '/me',
  requireAuthentication,
  loggedInUser,
);
// uppfærir netfang, lykilorð eða bæði ef gögn rétt, aðeins ef notandi innskráður
router.patch(
  '/me',
  validationUpdate,
  xssSanitizationMiddleware,
  requireAuthentication,
  catchErrors(updateLoggedInUser),
);
// skilar notanda, aðeins ef notandi sem framkvæmir er stjórnandi
router.get(
  '/:userId',
  validationGetUser,
  requireAuthentication,
  ensureAdmin,
  catchErrors(oneUser),
);
/*
breytir hvort notandi sé stjórnandi eða ekki, aðeins ef notandi sem framkvæmir er stjórnandi
og er ekki að breyta sér sjálfum
*/
router.patch(
  '/:userId',
  requireAuthentication,
  validationUpdateAdmin,
  validationGetUser,
  xssSanitizationMiddleware,
  sanitize,
  ensureAdmin,
  catchErrors(updateUser),
);

// Aldrei skal skila eða sýna hash fyrir lykilorð.
