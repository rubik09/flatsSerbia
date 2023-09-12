import axios from 'axios';
import fs from 'fs/promises';
import { regexSearchNewFlats } from './config';
// {/* <h2 class="offer-title text-truncate w-100">…</h2> */}
async function checkFolder() {
  try {
    await fs.access('src/links.json');
  } catch (err) {
    console.log(err.message);
    const dataNiekrtne = await axios.get('https://www.nekretnine.rs/stambeni-objekti/stanovi/izdavanje-prodaja/izdavanje/grad/beograd/vlasnik/lista/po-stranici/20/');
    const htmlNiekretne = dataNiekrtne.data;
    const regexNiekrtne = /<h2 class="offer-title text-truncate w-100">.*?<a href="(.*?)"/gs;
    const matchesiekrtne = [...htmlNiekretne.matchAll(regexNiekrtne)];

    if (matchesiekrtne.length > 0) {
      const links = matchesiekrtne.map((match) => `https://www.nekretnine.rs${match[1]}`);
      const jsonData = JSON.stringify(links, null, 2);

      await fs.writeFile('src/linksNiekretnie.json', jsonData, 'utf8');
      console.log('create file linksNiekretnie.json');
    } else {
      console.log('Ссылки с классом offer-title не найдены.');
    }

    const dataHalo = await axios.get('https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237%2C387300');
    const htmlHalo = dataHalo.data;
    const regexHalo = /<h3 class="product-title">.*?<a\s+href="([^"]+)"/g;
    const matchesHalo = [...htmlHalo.matchAll(regexHalo)];

    if (matchesHalo.length > 0) {
      const links = matchesHalo.map((match) => `https://www.halooglasi.com${match[1]}`);
      const jsonData = JSON.stringify(links, null, 2);

      await fs.writeFile('src/links.json', jsonData, 'utf8');
      console.log('create file links.json');
    } else {
      console.log('Ссылки с классом product-title не найдены.');
    }
  }
}

export default checkFolder;
