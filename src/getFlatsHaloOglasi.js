import fs from 'fs/promises';
import axios from 'axios';
import { regexInfoForFlat, BOTID, CHANNELID , regexSearchNewFlats} from './config';
import bot from './tg';


async function getFlatsHaloOglasi() {
  const data = await axios.get('https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237%2C387300');
  const html = data.data;

  const regex = /<h3 class="product-title">.*?<a\s+href="([^"]+)"/g;
  const matches = [...html.matchAll(regex)];
  if (matches.length > 0) {
    const links = matches.map((match) => `https://www.halooglasi.com${match[1]}`);
    //console.log(links);
    const limitedLinks = links.slice(0, 5);
    const file = await fs.readFile('links.json', 'utf8');
    const parsedFile = JSON.parse(file);

    const newLinks = limitedLinks.filter((link) => {
      const idMatch = link.match(/\/(\d+)\b(?!-\d)/);
      if (idMatch) {
        const id = idMatch[1];
        return !parsedFile.some((parsedLink) => parsedLink.includes(`/${id}`));
      }
    });

    if (newLinks.length > 0) {
      console.log('New links found:', newLinks);

      for (const link of newLinks) {
        const flat = await axios.get(link);
        const htmlFlat = flat.data;
        const matchesFlats = regexInfoForFlat.exec(JSON.stringify(htmlFlat));
        if (matchesFlats && matchesFlats.length >= 2) {
          const jsonString = matchesFlats[1];
          try {
            const cleanedInput = jsonString.replace(/\\/g, '');
            const jsonObject = JSON.parse(cleanedInput);
            const otherThingsForFlat = jsonObject.OtherFields.ostalo_ss ? jsonObject.OtherFields.ostalo_ss.join(', ') : '-';
            const extraThingsForFlat = jsonObject.OtherFields.dodatno_ss ? jsonObject.OtherFields.dodatno_ss.join(', ') : '-';
            const photosUrl = jsonObject.ImageURLs.splice(0, 9).map((item) => `https://img.halooglasi.com${item}`);
            if(!photosUrl.length) continue;

            const result = `1. Цена - ${jsonObject.OtherFields.cena_d} ${jsonObject.OtherFields.cena_d_unit_s}\n2. Расположение - ${jsonObject.OtherFields.mikrolokacija_s}, ${jsonObject.OtherFields.ulica_t}\n3. Площадь - ${jsonObject.OtherFields.kvadratura_d} ${jsonObject.OtherFields.kvadratura_d_unit_s}\n4. Тип квартиры - ${jsonObject.OtherFields.broj_soba_s}\n5. Этаж - ${jsonObject.OtherFields.sprat_s}\n6. Тип отопления - ${jsonObject.OtherFields.grejanje_s}\n7. Доп. сведения - ${otherThingsForFlat}\n8. Экстра сведения - ${extraThingsForFlat}\n9. Ссылка - ${link}`;

            const photosToGroup = photosUrl.map((photo, index) => {
                const photoToSend = { type: 'photo', media: photo, parse_mode: 'HTML' };
                if (index === 0) {
                  photoToSend.caption = result;
                }
                return photoToSend;
              });
              console.log(photosToGroup)
            await bot.sendMediaGroup(CHANNELID, photosToGroup);
          } catch (err) {
            console.log('Ошибка при парсинге JSON:', err);
          }
        } else {
          console.log('Объект QuidditaEnvironment.CurrentClassified не найден.');
        }
        const updatedFile = newLinks.concat(parsedFile.slice(0, parsedFile.length - newLinks.length));
        const jsonData = JSON.stringify(updatedFile, null, 2);
        await fs.writeFile('links.json', jsonData, 'utf8');
      }
    } else {
      console.log('No new links found.');
    }
  }
}

export default getFlatsHaloOglasi;
