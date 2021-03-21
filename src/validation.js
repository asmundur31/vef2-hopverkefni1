import pkg from 'express-validator';
import xss from 'xss';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  findByUsername,
  findByEmail,
  comparePasswords,
  findById,
} from './users.js';
import {
  getRatingStatus,
} from './db.js';

const { body, param } = pkg;

const path = dirname(fileURLToPath(import.meta.url));

export const validationLogin = [
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

export const validationRegister = [
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

export const validationUpdateAdmin = [
  body('admin')
    .isBoolean()
    .withMessage('admin má bara vera true eða false'),
  body('admin')
    .custom((value, { req }) => {
      // Athugum hvort admin er að reyna að breyta sjálfum sér
      if (parseInt(req.user.id, 10) === parseInt(req.params.userId, 10)) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Admin má ekki breyta sjálfum sér'),
];

export const validationUpdate = [
  body('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt')
    .optional(),
  body('email')
    .isEmail()
    .withMessage('Netfang verður að vera gilt netfang')
    .optional(),
  body('email')
    .custom(async (value) => {
      // Athugum hvort netfang er frátekið
      const user = await findByEmail(value);
      if (user) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Netfang er frátekið')
    .optional(),
  body('password')
    .isLength({ min: 10, max: 256 })
    .withMessage('Lykilorð verður að vera a.m.k 10 stafir og hámarki 256 stafir')
    .optional(),
];

export const validationGetUser = [
  param('userId')
    .toInt()
    .custom(async (value) => {
      // Athugum hvort netfang er frátekið
      const user = await findById(value);
      if (!user) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Fannst ekki'),
];

export const validationRating = [
  body('rating')
    .isInt({ min: 0, max: 5 })
    .withMessage('Aðeins má gefa heiltölu einkunn á bilinu [0;5]'),
];

export const validationNewRating = [
  body('rating')
    .custom(async (value, { req }) => {
      // Athugum hvort rating er til
      const rating = await getRatingStatus(req.user.id, req.params.seriesId);
      if (rating && rating.rate) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Er núþegar til'),
];

export const validationUpdateRating = [
  param('seriesId')
    .custom(async (value, { req }) => {
      // Athugum hvort rating er til
      const rating = await getRatingStatus(req.user.id, req.params.seriesId);
      if (!rating || !rating.rate) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Ekki til einkunn'),
];

export const validationState = [
  body('state')
    .isIn(['Langar að horfa', 'Er að horfa', 'Hef horft'])
    .withMessage('Aðeins má gefa stöðu sem er \'Langar að horfa\', \'Er að horfa\' eða \'Hef horft\''),
];

export const validationNewState = [
  body('rating')
    .custom(async (value, { req }) => {
      // Athugum hvort state er til
      const state = await getRatingStatus(req.user.id, req.params.seriesId);
      if (state && state.state) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Er núþegar til'),
];

export const validationUpdateState = [
  param('seriesId')
    .custom(async (value, { req }) => {
      // Athugum hvort state er til
      const state = await getRatingStatus(req.user.id, req.params.seriesId);
      if (!state || !state.state) {
        return Promise.reject();
      }
      return true;
    })
    .withMessage('Ekki til staða'),
];

export const validationUpdateSeries = [
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt')
    .optional(),
  body('air_date')
    .custom((value) => {
      // Reynum að kasta value yfir í löglegt date
      if (Date.parse(value)) {
        return true;
      }
      return Promise.reject();
    })
    .withMessage('Dagsetning ekki á réttu formi')
    .optional(),
  body('in_production')
    .custom((value) => {
      if (value === 'true' || value === 'false') {
        return true;
      }
      return Promise.reject();
    })
    .withMessage('Má bara vera \'true\' eða \'false\'')
    .optional(),
];

export function validateImage(req, res, next) {
  // Athugum hvort myndin hafi rétt file extension
  let mimeType;
  if (req.file) {
    mimeType = req.file.mimetype;
  } else {
    return next();
  }
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimeTypes.indexOf(mimeType) >= 0) {
    return next();
  }
  const error = {
    value: `Mynd er ${mimeType}`,
    msg: 'Mynd ekki á réttu formi, leyfileg form eru image/jpeg, image/png eða image/gif.',
    param: 'image',
    location: 'body',
  };
  req.imageError = error;
  return next();
}

// Viljum keyra sér og með validation, ver gegn „self XSS“
export const xssSanitizationMiddleware = [
  body('username').customSanitizer((v) => xss(v)),
  body('email').customSanitizer((v) => xss(v)),
  body('password').customSanitizer((v) => xss(v)),
  body('admin').customSanitizer((v) => xss(v)),
  body('name').customSanitizer((v) => xss(v)),
  body('air_time').customSanitizer((v) => xss(v)),
  body('in_production').customSanitizer((v) => xss(v)),
  body('tagline').customSanitizer((v) => xss(v)),
  body('image').customSanitizer((v) => xss(v)),
  body('description').customSanitizer((v) => xss(v)),
  body('language').customSanitizer((v) => xss(v)),
  body('network').customSanitizer((v) => xss(v)),
  body('url').customSanitizer((v) => xss(v)),
  body('genres').customSanitizer((v) => xss(v)),
  body('seasons').customSanitizer((v) => xss(v)),
  param('userId').customSanitizer((v) => xss(v)),
];

// Listi af hreinsun á gögnum
export const sanitize = [
  body('username').trim().escape(),
  body('email').normalizeEmail(),
  body('password').trim().escape(),
  body('admin').trim().escape(),
];

export const sanitizeSeries = [
  body('name').trim().escape(),
  body('air_time').toDate(),
  body('in_production').trim().escape(),
  body('tagline').trim().escape(),
  body('description').trim().escape(),
  body('language').trim().escape(),
  body('network').trim().escape(),
  body('url').trim().escape(),
];
