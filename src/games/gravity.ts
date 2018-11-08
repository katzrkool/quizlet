import {Browser} from 'puppeteer';
import {getText} from '../util';

class Gravity {
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
        await page.setViewport({width: 1440, height: 900});
        await page.goto(this.url);
        await page.waitForSelector('.UIButton--hero');
        await page.click('.UIButton--hero');

        await page.waitForSelector('input[value=\'EXPERT\']');
        await page.click('input[value=\'EXPERT\']');
        await page.click('.UIButton--hero');

        await page.waitForSelector('.UIButton--hero');
        await page.click('.UIButton--hero');

        const prompt = await page.$('.GravityTypingPrompt-input');

        if (!prompt) {throw new Error('No Input'); }

        console.log('Press ESC on the browser to quit');

        let asteroidCount = 0;

        while ((await page.$('.GravityCopyTermView-definition')) === null) {
            const asteroid = await page.$('.GravityTerm-content');
            if (asteroid) {
                const asteroidText = (await getText(asteroid, page)).trim();
                await prompt.type(this.answers[asteroidText]);
                await page.keyboard.press('Enter');
            }
            if (asteroidCount % 1000 === 0) {
                console.log('Current score: \t' + await getText('.GravityModeControls-value', page)
                + '\tLevel: \t' + await getText((await page.$$('.GravityModeControls-value'))[1], page));
            }
            asteroidCount += 1;
        }

        await page.close();
    }
}

export default Gravity;
