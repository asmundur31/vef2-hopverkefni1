import express from 'express';
import dotenv from 'dotenv';

import { router as mainRouter } from './routers/mainRouter.js';
import { router as tvRouter } from './routers/tvRouter.js';
import { router as genresRouter } from './routers/genresRouter.js';
import { router as usersRouter } from './routers/usersRouter.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();

app.use(express.json());

app.use('/', mainRouter);
app.use('/tv', tvRouter);
app.use('/genres', genresRouter);
app.use('/users', usersRouter);

function notFoundHandler(req, res, next) { // eslint-disable-line
  console.warn('Not found', req.originalUrl);
  res.status(404).json({ error: 'Not found - 404' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json - 400' });
  }

  return res.status(500).json({ error: 'Internal server error - 500' });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});