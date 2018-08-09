import {Browser, ElementHandle, launch, Page} from 'puppeteer';

function delay(ms: number) {
    return new Promise( (resolve) => setTimeout(resolve, ms) );
}

class Quizlet {
    private browser?: Browser;
    private page?: Page;
    private url?: string;
    async play() {
        await this.initSession();
        try {
            const answers = await this.scrape();
            await this.match(answers);
        } catch (e) {
            if (this.page) {await this.page.screenshot({path: 'error.png'}); }
            throw e;
        } finally {
            if (this.page) {await this.page.screenshot({path: 'done.png'}); }
            if (this.browser) await this.browser.close();
            process.exit();
        }
    }
    private async initSession() {
        let url = await this.prompt('What\'s the URL of the quizlet?\t');
        if (!url.endsWith('/')) {
            url += '/';
        }
        this.url = url;
        this.browser = await launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({width: 1920, height: 1080});
        console.log('Browser Initialized');
    }
    private async scrape(): Promise<object> {
        if (!this.page || !this.url) throw this.noPage();
        const {page} = this;
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
        return answers;
    }
    private async match(answers: object) {
        if (!this.page) throw this.noPage();
        const {page} = this;
        await page.setViewport({width: 335, height: 650});
        await this.page.goto(this.formatURL('match'));
        await this.page.waitForSelector('.UIButton--hero');

        await this.page.click('.UIButton--hero');
        let tiles = await this.tiles();
        while (tiles.length === 0) {
            await delay(100);
            tiles = await this.tiles();
        }
        const tileText = await Promise.all(tiles.map(async (tile) => {
            return (await this.getText(tile)).replace('\n', '');
        }));
        for (const i of tileText) {
            if (answers[i]) {
                await tiles[tileText.indexOf(i)].click();
                await tiles[tileText.indexOf(answers[i])].click();
            }
        }

        await this.page.waitForSelector('.HighscoresMessage');

        console.log('Time: ' + await this.getText('.HighscoresMessage-score'));

    }
    private async getText(ele: ElementHandle | string): Promise<string> {
        if (!this.page) throw this.noPage();
        let handle;
        if (typeof ele === 'string') {
            handle = await this.page.$(ele);
        } else {
            handle = ele;
        }
        return await this.page.evaluate((element) => {
            return element.innerText;
        }, handle);
    }
    private async tiles() {
        if (!this.page) throw this.noPage();
        return await this.page.$$('.MatchModeQuestionGridBoard-tile');
    }
    private formatURL(dest: string): string {
        if (!this.url) throw new Error('No URL!');
        const urlParts = this.url.split('/');
        if (isNaN(Number(urlParts[-2]))) {
            urlParts.splice(urlParts.length - 2, 1);
        }
        return urlParts.join('/')  + dest;
    }
    private noPage(): Error {
        return new Error('No Page!!');
    }
    private async prompt(question): Promise<string> {
        const stdin = process.stdin;
        const stdout = process.stdout;

        stdin.resume();
        stdout.write(question);

        return new Promise<string>((resolve, reject) => {
            stdin.once('data', (data) => resolve(data.toString().trim()));
        });
    }
}

export default Quizlet;
