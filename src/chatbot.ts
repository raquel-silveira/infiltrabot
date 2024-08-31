import { Client } from 'whatsapp-web.js';

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
        
        this.client.on('ready', () => {
            console.log('Chatbot is ready!');

            this.client.sendMessage('5515998592331@c.us', `Bot message.`);
        });
        
        this.client.on('message', (msg: any) => {
            if (msg.body === '!ping') {
                msg.reply('pong');
            }
        });
        
        this.client.initialize();
    }
}
