import express from 'express';
import fs from 'fs';
import util from 'util';

import { catchErrors } from '../utils.js';

export const router = express.Router();
const readFileAsync = util.promisify(fs.readFile);

async function allAvailable(req, res) {
  const all = JSON.parse(await readFileAsync('./src/availableRequests.json'));
  return res.json(all);
}

// Birtir allar fyrirspurnir sem eru í boði
router.get('/', catchErrors(allAvailable));
