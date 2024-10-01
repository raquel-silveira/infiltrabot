import { Client, Contact } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

export class Chatbot {
    private client: Client;

    constructor() {
        this.client = new Client({
            puppeteer: { 
                headless: false,
            }
        });

        this.client.on('qr', (qr: string) => {
            console.log('QR RECEIVED', qr);
        });
        
        this.client.on('ready', async () => {
            console.log('Chatbot is ready!');

            await this.checkComplaintsInProfiles();
        });

        this.client.initialize();
    }

    private loadComplaints(): { phoneNumber: string, companyName: string }[] {
        const filePath = path.resolve('complaints.json');

        if (!fs.existsSync(filePath)) {
            console.log('Arquivo complaints.json não encontrado!');
            return [];
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }

    public async checkComplaintsInProfiles() {
        const complaints = this.loadComplaints();

        if (complaints.length === 0) {
            console.log('Nenhum dado de reclamação para processar.');
            return;
        }

        for (const complaint of complaints) {
            const { phoneNumber, companyName } = complaint;

            try {
                const contact: Contact = await this.client.getContactById(`${phoneNumber}@c.us`);

                if (contact && contact.pushname && contact.pushname.toLowerCase().includes(companyName.toLowerCase())) {
                    console.log(`Nome da empresa "${companyName}" encontrado no número: ${phoneNumber}`);
                } else {
                    console.log(`Nome da empresa "${companyName}" não encontrado no número: ${phoneNumber}`);
                }
            } catch (error) {
                console.log(`Erro ao buscar perfil do número: ${phoneNumber}`);
            }
        }
    }
}
