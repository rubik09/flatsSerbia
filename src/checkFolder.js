import axios from 'axios';
import fs from 'fs/promises';
import { regexSearchNewFlats, PAGES_HALOOGLASI } from './config';
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
    const mainLink = 'https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237%2C387300';
    let newLinks = [];
    for(let i = 1; i < PAGES_HALOOGLASI + 1; i++){
      const { data } = await axios.get(`${mainLink}&page=${i}`);
      const regexHalo1 = /<h3 class="product-title">.*?<a\s+href="([^"]+)"/g;
      const matchesHalo1 = [...data.matchAll(regexHalo1)];
  
      if (matchesHalo1.length > 0) {
        const linksHalo = matchesHalo1.map((match) => `https://www.halooglasi.com${match[1]}`);
      newLinks = [...newLinks, ...linksHalo]
    }}

    if (newLinks.length > 0) {
      const jsonData = JSON.stringify(newLinks, null, 2);
      await fs.writeFile('src/links.json', jsonData, 'utf8');
      console.log('create file links.json');
    } else {
      console.log('Ссылки с классом product-title не найдены.');
    }
  }
}

export default checkFolder;
