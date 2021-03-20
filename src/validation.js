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
