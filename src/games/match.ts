import {Page} from 'puppeteer';
import {delay, getText, noPage} from '../util';

class Match {
    private page: Page;
    private answers: object;
    private url: string;
    constructor(page: Page, answers: object, url: string) {
        this.page = page;
        this.answers = answers;
        this.url = url;
    }

    public async match() {
        const {page} = this;
        await page.setViewport({width: 335, height: 650});
        await page.goto(this.url);
        await page.waitForSelector('.UIButton--hero');

        await page.click('.UIButton--hero');
        let tiles = await this.tiles();
        while (tiles.length === 0) {
            await delay(100);
            tiles = await this.tiles();
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
    }

    private async tiles() {
        if (!this.page) throw noPage();
        return await this.page.$$('.MatchModeQuestionGridBoard-tile');
    }
}

export default Match;
