import fs, { promises } from 'fs';
import csvParser from 'csv-parser';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import {
  query,
  insertSerie,
  insertSeason,
  insertEpisode,
  insertGenres,
  insertSeriesGenres,
  selectGenreId,
  updateImageFromSeries,
  imageExistsInSeries,
  updateImageFromSeasons,
} from './db.js';

const schemaFile = './sql/schema.sql';
const dropFile = './sql/drop.sql';
const dir = './data/img/';
const files = fs.readdirSync(dir);

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

function getData(file) {
  const result = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on('error', (error) => {
        reject(error);
      })
      // .pipe(csv({ headers: false, separator: ',' }))
      .pipe(csvParser())
      .on('data', (data) => {
        result.push(data);
        // console.log(data);
      })
      .on('end', () => {
        resolve(result);
      });
  });
}

async function addSeries() {
  try {
    const data = await getData('./data/series.csv');
    // console.log('testGetData: parsed CSV data:', data);
    data.map(async (d) => {
      await insertSerie(d);
    });
    // await insertSerie(data[0]);
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

async function addSeasons() {
  try {
    const data = await getData('./data/seasons.csv');
    // console.log('testGetData: parsed CSV data:', data);
    data.map(async (d) => {
      try {
        await insertSeason(d);
      } catch (error) {
        console.error('Erro while inserting: ', error.message);
      }
    });
    // await insertSeason(data[0]);
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

async function addEpisodes() {
  try {
    const data = await getData('./data/episodes.csv');
    // console.log('testGetData: parsed CSV data:', data);
    data.map(async (d) => {
      try {
        await insertEpisode(d);
      } catch (error) {
        console.error('Erro while inserting: ', error.message);
      }
    });
    // await insertEpisode(data[0]);
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

async function addGenres() {
  const genres = [];
  try {
    const data = await getData('./data/series.csv');
    // eslint-disable-next-line array-callback-return
    const genresWithId = data.map(async (d) => {
      const genreForSeries = d.genres.split(',');
      const answer = genreForSeries.map(async (g) => {
        if (Object.values(genres).indexOf(g) <= -1) {
          genres.push(g);
          const ID = await insertGenres(g);
          // genresWithId.push({ id: ID[0].id, genre: g });
          // await insertSeriesGenres(d.id, ID);
          // console.log(genresWithId);
          const { id } = ID[0];
          return { id, g };
        }
      });
      // eslint-disable-next-line no-return-await
      return await Promise.all(answer);
    });
    return await Promise.all(genresWithId);
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

async function addSeriesGenres() {
  try {
    const data = await getData('./data/series.csv');
    // eslint-disable-next-line array-callback-return
    data.map(async (d) => {
      const genreForSeries = d.genres.split(',');
      genreForSeries.map(async (g) => {
        const id = await selectGenreId(g);
        try {
          await insertSeriesGenres(d.id, id[0].id);
        } catch (e) {
          console.error('Error while inserting series_genres: ', e.message);
        }
        /* console.log(genresWithId);
        genresWithId.map(async (gI) => {
          if (gI.genre.localeCompare(g.toString()) === 0) {
            // await insertSeriesGenres(d.id, gI.id);
            console.log('here');
          }
        }); */
      });
    });
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

async function uploadImageToCloudinary() {
  const response = files.map(async (file) => {
    const answer = await cloudinary.v2.uploader.upload(
      `./data/img/${file}`,
    );
    return { file, answer };
  });
  // eslint-disable-next-line no-return-await
  return await Promise.all(response);
}

async function updateImageInDatabase(urls) {
  urls.forEach(async (url) => {
    const result = await imageExistsInSeries(url.file);
    if (result[0].exists) {
      await updateImageFromSeries(url.answer.secure_url, url.file);
    } else {
      await updateImageFromSeasons(url.answer.secure_url, url.file);
    }
  });
}

async function main() {
  try {
    const drop = await promises.readFile(dropFile);
    await query(drop.toString('utf-8'));
  } catch (e) {
    console.error('Villa við að eyða töflum:', e.message);
    return;
  }

  try {
    const data = await promises.readFile(schemaFile);
    await query(data.toString('utf-8'));
  } catch (e) {
    console.error('Villa við að búa til töflur:', e.message);
    return;
  }
  console.info('Schema created');

  await addSeries();

  await addSeasons();

  await addEpisodes();

  await addGenres();

  await addSeriesGenres();

  const urls = await uploadImageToCloudinary();

  await updateImageInDatabase(urls);

  console.info('Data inserted');

  // await end();
}

main().catch((err) => {
  console.error(err);
});
