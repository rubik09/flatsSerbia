import "dotenv/config";
import cron from "node-cron";
import getFlatsHaloOglasi from "./getFlatsHaloOglasi";
import checkFolder from "./checkFolder";
import getFlatsNiekretnie from "./getFlatsNiekretne";

await checkFolder();

cron.schedule("* * * * *", async () => {
  await getFlatsHaloOglasi();
});
cron.schedule("* * * * *", async () => {
  await getFlatsNiekretnie();
});
