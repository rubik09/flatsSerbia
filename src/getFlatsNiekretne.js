import fs from "fs/promises";
import axios from "axios";
import { regexInfoForFlat, CHANNELID, regexSearchNewFlats } from "./config";
import bot from "./tg";
import cheerio from "cheerio";

async function getFlatsNiekretnie() {
  const dataNiekrtne = await axios.get(
    "https://www.nekretnine.rs/stambeni-objekti/stanovi/izdavanje-prodaja/izdavanje/grad/beograd/vlasnik/lista/po-stranici/20/"
  );
  const htmlNiekretne = dataNiekrtne.data;
  const regexNiekrtne =
    /<h2 class="offer-title text-truncate w-100">.*?<a href="(.*?)"/gs;
  const matchesiekrtne = [...htmlNiekretne.matchAll(regexNiekrtne)];
  if (matchesiekrtne.length > 0) {
    const links = matchesiekrtne.map(
      (match) => `https://www.nekretnine.rs${match[1]}`
    );
    // const limitedLinks = links.slice(0, 10);
    const file = await fs.readFile("src/linksNiekretnie.json", "utf8");
    const parsedFile = JSON.parse(file);

    const newLinks = links.filter((link) => !parsedFile.includes(link));

    if (newLinks.length > 0) {
      console.log("New links found for niekretne:", newLinks);

      for (const link of newLinks) {
        try {
          console.log(link);
          await new Promise((resolve) => setTimeout(resolve, 500));
          const flatInfo = {};
          const flat = await axios.get(link);
          const htmlFlat = flat.data;
          const $ = cheerio.load(htmlFlat);
          const location = $(".stickyBox__Location").text().trim();
          const price = $(".stickyBox__price").text().trim();
          flatInfo.location = location;
          flatInfo.price = price;
          const properties = $("div.property__main-details li");
          const elementsWithDataGalleryUrl = $("[data-gallery-url]");

          if (elementsWithDataGalleryUrl.length > 0) {
            const dataGalleryUrl = elementsWithDataGalleryUrl
              .eq(0)
              .attr("data-gallery-url");
            console.log(dataGalleryUrl);
            flatInfo.photoUrl = `https://www.nekretnine.rs${dataGalleryUrl}`;
          }
          properties.each((index, element) => {
            const $element = $(element);
            const text = $element.text().trim();
            const [title, info] = text.split(":");
            flatInfo[title.trim()] = info.trim();
          });
          if (flatInfo.photoUrl) {
            const photo = await axios.get(flatInfo.photoUrl);
            const photos = cheerio.load(photo.data);

            const zoomContainers = photos(".swiper-zoom-container");
            const imageUrls = [];
            zoomContainers.each((index, container) => {
              const containerElement = $(container);
              const imgElement = containerElement.find("img");
              const src = imgElement.attr("src");
              imageUrls.push(src);
            });
            const finalImages = imageUrls.slice(0, 9);
            delete flatInfo.photoUrl;
            const result = Object.entries(flatInfo)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");

            console.log(result);
            const photosToGroup = finalImages.map((photo, index) => {
              const photoToSend = {
                type: "photo",
                media: photo,
                parse_mode: "HTML",
              };
              if (index === 0) {
                photoToSend.caption = `${result}\n${link}`;
              }
              return photoToSend;
            });
            await bot.sendMediaGroup(-1001700970489, photosToGroup);
          }
        } catch (err) {
          console.log(err.message);
        }
        const jsonData = JSON.stringify(links, null, 2);
        await fs.writeFile("src/linksNiekretnie.json", jsonData, "utf8");
      }
    } else {
      console.log("No new links found for niekretne.");
    }
  }
}

export default getFlatsNiekretnie;
