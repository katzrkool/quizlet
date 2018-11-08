import {Browser, launch} from 'puppeteer';
import Gravity from './games/gravity';
import Live from './games/live';
import Match from './games/match';
import {noPage, prompt} from './util';

class Quizlet {
    private browser?: Browser;
    private url?: string;
    private answers?: object;
    private game: string = '';
    async play() {
        await this.initSession();
        try {
            this.answers = await this.scrape();
            this.game = await this.gamePick();
            await this.go();
        } catch (e) {
            console.log(e);
        } finally {
            if (this.browser) await this.browser.close();
            process.exit();
        }
    }
    private async go() {
        if (!this.browser) {throw new Error('No Browser!'); }
        if (!this.answers) {throw new Error('No Answers!'); }
        if (this.game === 'm') {
            await new Match(this.browser, this.answers, this.formatURL('match')).go();
        } else if (this.game === 'g') {
            await new Gravity(this.browser, this.answers, this.formatURL('gravity')).go();
        } else if (this.game === 'l') {
            await new Live(this.browser, this.answers, await prompt('What is the game code?\t')).go();
        }
        await this.again();
    }
    private async initSession() {
        let url = await prompt('What\'s the URL of the quizlet?\t');
        if (!url.endsWith('/')) {
            url += '/';
        }
        this.url = url;
        this.browser = await launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
        });
        console.log('Browser Initialized');
    }
    private async again() {
        const ans = await prompt('Try again? (y\\n) or change games (g)\t');
        if (ans === 'y') {
            await this.go();
        } else if (ans === 'g') {
            this.game = await this.gamePick();
            await this.go();
        }
    }
    private async gamePick() {
        return await prompt('Would you like to play Match (m) or Gravity (g)\t'); // , or Live (l)
    }
    private async scrape(): Promise<object> {
        if (!this.browser || !this.url) throw noPage();
        const page = await this.browser.newPage();
        await page.setViewport({width: 1920, height: 1080});
        await page.goto(this.url);

        await (await page.$$('.SetPage-header .UIButton'))[3].click();

        await page.waitForSelector('.UIIcon--export', {visible: true});
        await page.click('.UIIcon--export');
        await page.waitForSelector('.SetPageExportModal-content', {visible: true});

        await page.type('.UIInput-input', '~~first~~');

        const text = await page.$('.UITextarea-textarea');

        const rawAnswers = await page.evaluate((textHandle) => textHandle.innerHTML, text);
        const answers = {};
        for (const i of rawAnswers.split('\n')) {
            const split = i.split(' - ~~first~~');
            answers[split[0]] = split[1];
        }
        await page.close();
        return answers;
    }
    private formatURL(dest: string): string {
        if (!this.url) throw new Error('No URL!');
        const urlParts = this.url.split('/');
        if (isNaN(Number(urlParts[-2]))) {
            urlParts.splice(urlParts.length - 2, 1);
        }
        return urlParts.join('/')  + dest;
    }
}

export default Quizlet;
