import type { Browser } from 'puppeteer';

import { input, logSpinner } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

const WEBSITE_TITLES = ['protesteorg', 'reclame aqui'];
const KEYWORDS = ['golpe whatsapp'];
const COMPLAINTS_FILE_PATH = path.resolve('complaints.json');

export class SearchForComplaints {
  constructor(private readonly browser: Browser) {}

  public async execute(): Promise<string[]> {
    const companyName = await input('Nome da empresa: ');

    console.log(`Buscando por reclamações da empresa "${companyName}"`);

    const spinner = logSpinner();
    spinner.start();

    const validUrls: string[] = [];
    const allPhoneNumbers: string[] = [];

    for (const keyword of KEYWORDS) {
      for (const websiteTitle of WEBSITE_TITLES) {
        const search = `${keyword} "${companyName}" ${websiteTitle}`;
        spinner.text = `Buscando por: ${search}`;

        const urls = await this.getUrls({ search, total: 1 });

        for (const url of urls) {
          const phoneNumbers = await this.urlHasPhoneNumberInTheContent(url);

          if (phoneNumbers.length > 0) {
            validUrls.push(url);
            allPhoneNumbers.push(...phoneNumbers);
          }
        }

        console.log('');
      }
    }

    await this.browser.close();
    spinner.stop();

    if (allPhoneNumbers.length > 0) {
      this.saveComplaints(allPhoneNumbers, companyName);
    } else {
      console.log('Nenhum número de telefone encontrado.');
    }

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

  private async urlHasPhoneNumberInTheContent(url: string): Promise<string[]> {
    try {
      const page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 0 });

      // Regular expression to match phone numbers
      const phoneRegex = /\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/;
      const content = await page.content();
      const phoneNumbers = content.match(phoneRegex) || [];

      await page.close();

      return phoneNumbers;
    } catch (error) {
      console.error('Erro ao verificar o conteúdo da URL:', error);
      return [];
    }
  }

  private saveComplaints(phoneNumbers: string[], companyName: string): void {
    let complaints: { phoneNumber: string; companyName: string }[] = [];

    if (fs.existsSync(COMPLAINTS_FILE_PATH)) {
      const data = fs.readFileSync(COMPLAINTS_FILE_PATH, 'utf-8');
      complaints = JSON.parse(data);
    }

    for (const phoneNumber of phoneNumbers) {
      complaints.push({ phoneNumber, companyName });
    }

    fs.writeFileSync(
      COMPLAINTS_FILE_PATH,
      JSON.stringify(complaints, null, 2),
      'utf-8'
    );
    console.log(`Reclamações salvas no arquivo complaints.json.`);
  }
}
