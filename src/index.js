import 'dotenv/config';
import cron from 'node-cron';
import getFlatsHaloOglasi from './getFlatsHaloOglasi';
import checkFolder from './checkFolder';

await checkFolder();

cron.schedule('* * * * *', async () => {
  await getFlatsHaloOglasi();
});
