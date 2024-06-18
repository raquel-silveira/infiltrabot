import * as puppeteer from 'puppeteer';

import { SearchForComplaints } from './search-for-complaints';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1080,720'],
    defaultViewport: null,
  });

  const searchForComplaints = new SearchForComplaints(browser);

  const urls = await searchForComplaints.execute();

  if (urls.length === 0) {
    console.log('Nenhuma reclamação com números de telefone encontrada');
    process.exit(0);
  } else {
    console.log('Reclamações encontradas:');
    urls.forEach((url) => console.log(url));
  }
})();
