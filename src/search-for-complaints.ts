import type { Browser } from 'puppeteer';

import { input, logSpinner } from './utils';

const WEBSITE_TITLES = ['protesteorg', 'reclame aqui'];
const KEYWORDS = ['golpe whatsapp'];

export class SearchForComplaints {
  constructor(private readonly browser: Browser) {}

  public async execute(): Promise<string[]> {
    const companyName = await input('Nome da empresa: ');

    console.log(`Buscando por reclamações da empresa "${companyName}"`);

    const spinner = logSpinner();
    spinner.start();

    const validUrls: string[] = [];

    for (const keyword of KEYWORDS) {
      for (const websiteTitle of WEBSITE_TITLES) {
        const search = `${keyword} "${companyName}" ${websiteTitle}`;
        spinner.text = `Buscando por: ${search}`;

        const urls = await this.getUrls({ search, total: 1 });
        const urlsWithPhones = [];

        for (const url of urls) {
          if (await this.urlHasPhoneNumberInTheContent(url)) {
            urlsWithPhones.push(url);
          }
        }

        console.log('');

        validUrls.push(...urlsWithPhones);
      }
    }

    await this.browser.close();

    spinner.stop();

    return validUrls;
  }

  private async getUrls({
    search,
    total,
  }: {
    search: string;
    total: number;
  }): Promise<string[]> {
    const baseUrl = 'https://www.google.com/search?q=';
    const encodedSearch = encodeURIComponent(search);
    const url = `${baseUrl}${encodedSearch}`;

    try {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 0 });

      const urls = await page.evaluate(
        (n) => {
          const elements = Array.from(document.querySelectorAll('.yuRUbf a'));
          const links = elements.map((link) => link.getAttribute('href'));

          return links.slice(0, n as unknown as number);
        },
        [total],
      );

      await page.close();

      return urls;
    } catch (error) {
      console.error('Erro ao buscar URLs:', error);

      return [];
    }
  }

  private async urlHasPhoneNumberInTheContent(url: string): Promise<boolean> {
    try {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 0 });

      // Regular expression to match phone numbers
      const phoneRegex = /\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/g;
      const content = await page.content();
      const hasPhoneNumber = phoneRegex.test(content);

      await page.close();

      return hasPhoneNumber;
    } catch (error) {
      console.error('Erro ao verificar o conteúdo da URL:', error);

      return false;
    }
  }
}
