import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const dir = './data/img/';
const files = fs.readdirSync(dir);

for (const file of files) {
  cloudinary.v2.uploader.upload(
    `./data/img/${file}`,
    (error, result) => { console.log(result, error); },
  );
}
