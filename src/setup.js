import fs, { promises } from 'fs';
import csvParser from 'csv-parser';
import { query, end, insertSerie } from './db.js';

const schemaFile = './sql/schema.sql';

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
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
}

/* async function addSeasons() {
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
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
} */

/* async function addEpisodes() {
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
  } catch (error) {
    console.error('Error while parsing csv data: ', error.message);
  }
} */

async function main() {
  const data = await promises.readFile(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await addSeries();

  // await addSeasons();

  // await addEpisodes();

  console.info('Data inserted');

  // await end();
}

main().catch((err) => {
  console.error(err);
});
