import pkg from 'express-validator';
import xss from 'xss';

import {
  findByUsername,
  findByEmail,
  comparePasswords,
  findById,
} from './users.js';

const { body, param } = pkg;

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

// Viljum keyra sér og með validation, ver gegn „self XSS“
export const xssSanitizationMiddleware = [
  body('username').customSanitizer((v) => xss(v)),
  body('email').customSanitizer((v) => xss(v)),
  body('password').customSanitizer((v) => xss(v)),
  body('admin').customSanitizer((v) => xss(v)),
];

// Listi af hreinsun á gögnum
export const sanitize = [
  body('username').trim().escape(),
  body('email').normalizeEmail(),
  body('password').trim().escape(),
  body('admin').trim().escape(),
];

export const validationGenre = [
  body('name')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
];

export const sanitizeGenre = [
  body('name').customSanitizer((v) => xss(v)),
  body('name').trim().escape(),
];

export const validationEpisode = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 129 })
    .withMessage('Nafn má ekki vera tómt'),
  body('number')
    .isLength({ min: 1 })
    .isInt({ min: 1 })
    .withMessage('Númer má ekki vera tómt og verður að vera hærra en 0'),
  body('airDate')
    .isDate()
    .withMessage('Dagsetning á að vera á forminu YYYY-MM-DD')
    .optional(),
  body('overview')
    .isString()
    .optional(),
  param('seasonId')
    .toInt()
    .isLength({ min: 1 })
    .withMessage('Númer á season má ekki vera tómt'),
  param('seriesId')
    .toInt()
    .isLength({ min: 1 })
    .withMessage('Id á serie má ekki vera tómt'),
];

export const sanitizeEpisode = [
  body('name').customSanitizer((v) => xss(v)),
  body('name').trim().escape(),
  body('number').customSanitizer((v) => xss(v)),
  body('number').trim().escape(),
  body('airDate').customSanitizer((v) => xss(v)),
  body('airDate').trim().escape(),
  body('overrview').customSanitizer((v) => xss(v)),
  body('overview').trim().escape(),
  param('seasonId').customSanitizer((v) => xss(v)),
  param('seasonId').trim().escape(),
  param('seriesId').customSanitizer((v) => xss(v)),
  param('seriesId').trim().escape(),
];

export const validationSeason = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 129 })
    .withMessage('Nafn má ekki vera tómt'),
  body('number')
    .isLength({ min: 1 })
    .isInt({ min: 1 })
    .withMessage('Númer má ekki vera tómt og verður að vera hærra en 0'),
  body('airDate')
    .isDate()
    .withMessage('Dagsetning á að vera á forminu YYYY-MM-DD')
    .optional(),
  body('overview')
    .isString()
    .optional(),
  body('poster')
    .isLength({ min: 1 })
    .withMessage('Poster má ekki vera tómt'),
  param('seriesId')
    .toInt()
    .isLength({ min: 1 })
    .withMessage('Id á serie má ekki vera tómt'),
];

export const sanitizeSeason = [
  body('name').customSanitizer((v) => xss(v)),
  body('name').trim().escape(),
  body('number').customSanitizer((v) => xss(v)),
  body('number').trim().escape(),
  body('airDate').customSanitizer((v) => xss(v)),
  body('airDate').trim().escape(),
  body('overrview').customSanitizer((v) => xss(v)),
  body('overview').trim().escape(),
  body('poster').customSanitizer((v) => xss(v)),
  body('poster').trim().escape(),
  param('seriesId').customSanitizer((v) => xss(v)),
  param('seriesId').trim().escape(),
];

export const validationSerie = [
  body('id')
    .isLength({ min: 1 })
    .withMessage('Id má ekki vera tómt'),
  body('name')
    .isString()
    .isLength({ min: 1, max: 129 })
    .withMessage('Nafn má ekki vera tómt'),
  body('airDate')
    .isDate()
    .withMessage('Dagsetning á að vera á forminu YYYY-MM-DD')
    .optional(),
  body('inProduction')
    .isBoolean()
    .withMessage('Production þarf að vera boolean'),
  body('tagline')
    .isString()
    .optional(),
  body('image')
    .isLength({ min: 1 })
    .withMessage('Image má ekki vera tómt'),
  body('description')
    .isString()
    .optional(),
  body('language')
    .isString()
    .isLength({ min: 1, max: 2 })
    .withMessage('Language má ekki vera tómt'),
  body('network')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Network má ekki vera tómt'),
  body('url')
    .isString()
    .optional(),
];

export const sanitizeSerie = [
  body('id').customSanitizer((v) => xss(v)),
  body('id').trim().escape(),
  body('name').customSanitizer((v) => xss(v)),
  body('name').trim().escape(),
  body('airDate').customSanitizer((v) => xss(v)),
  body('airDate').trim().escape(),
  body('inProduction').customSanitizer((v) => xss(v)),
  body('inProduction').trim().escape(),
  body('tagline').customSanitizer((v) => xss(v)),
  body('tagline').trim().escape(),
  body('image').customSanitizer((v) => xss(v)),
  body('image').trim().escape(),
  body('description').customSanitizer((v) => xss(v)),
  body('description').trim().escape(),
  body('language').customSanitizer((v) => xss(v)),
  body('language').trim().escape(),
  body('network').customSanitizer((v) => xss(v)),
  body('network').trim().escape(),
  body('url').customSanitizer((v) => xss(v)),
  body('url').trim().escape(),
];
