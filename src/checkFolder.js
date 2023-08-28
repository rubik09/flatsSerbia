import axios from 'axios';
import fs from 'fs/promises';
import { regexSearchNewFlats } from './config';

async function checkFolder() {
  try {
    await fs.access('src/links.json');
  } catch (err) {
    console.log(err.message);
    const data = await axios.get('http://halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237%2C387300');
    const html = data.data;
    const regex = /<h3 class="product-title">.*?<a\s+href="([^"]+)"/g;
    const matches = [...html.matchAll(regex)];

    if (matches.length > 0) {
      const links = matches.map((match) => `http://halooglasi.com${match[1]}`);
      const jsonData = JSON.stringify(links, null, 2);

      await fs.writeFile('src/links.json', jsonData, 'utf8');
      console.log('create file');
    } else {
      console.log('Ссылки с классом a-images не найдены.');
    }
  }
}

export default checkFolder;
