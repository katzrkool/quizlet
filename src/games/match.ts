import {Browser, Page} from 'puppeteer';
import {delay, getText} from '../util';

class Match {
    private browser: Browser;
    private answers: object;
    private url: string;
    constructor(browser: Browser, answers: object, url: string) {
        this.browser = browser;
        this.answers = answers;
        this.url = url;
    }

    public async go() {
        const page = await this.browser.newPage();
        await page.setViewport({width: 335, height: 650});
        await page.goto(this.url);
        await page.waitForSelector('.UIButton--hero');

        await page.click('.UIButton--hero');
        let tiles = await this.tiles(page);
        while (tiles.length === 0) {
            await delay(100);
            tiles = await this.tiles(page);
        }
        const tileText = await Promise.all(tiles.map(async (tile) => {
            return (await getText(tile, page)).replace('\n', '');
        }));
        for (const i of tileText) {
            if (this.answers[i]) {
                await tiles[tileText.indexOf(i)].click();
                await tiles[tileText.indexOf(this.answers[i])].click();
            }
        }

        await page.waitForSelector('.HighscoresMessage');

        console.log('Time: ' + await getText('.HighscoresMessage-score', page));
        await page.close();
    }

    private async tiles(page: Page) {
        return await page.$$('.MatchModeQuestionGridBoard-tile');
    }
}

export default Match;
