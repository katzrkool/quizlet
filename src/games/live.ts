import {Browser, Page} from 'puppeteer';
import {delay, getText, prompt} from '../util';

class Live {
    private answers: object;
    private code: string;
    private browser: Browser;
    constructor(browser: Browser, answers: object, code: string) {
        this.answers = answers;
        this.code = code;
        this.browser = browser;
    }

    public async go() {
        const botCount = Number(await prompt('How many live bots do you want? (1,2,3,etc)\t'));
        const name = await prompt('What name should be used?\t');
        const botsInAction: Array<Promise<void>> = [];

        for (let count = 0; count < botCount; count++) {
            botsInAction.push(this.run(`${name}${count}`,  await (await this.browser.createIncognitoBrowserContext()).newPage()));
        }
        await Promise.all(botsInAction);
    }

    private async run(name: string, page: Page) {
        await page.goto('https://quizlet.com/live');

        await page.waitForSelector('.UIInput-input');
        await page.type('.UIInput-input', this.code);
        await page.click('.UIButton--hero');

        // Ask for name to place in the box
        await page.waitForSelector('.UIInput-input');
        await delay(1000);
        await page.type('.UIInput-input', name);
        await page.click('.UIButton--hero');

        try {
            await page.waitForSelector('.StudentJoiningView-input--oneCharacter', {timeout: 1000});
            if (await page.$('.StudentJoiningView-input--oneCharacter')) {
                await page.type('.StudentJoiningView-input--oneCharacter', 'A');
                await page.click('.UIButton--hero');
            }
        } catch (e) {
            console.log('No Initial Test');
        }

        // Waiting for game to start
        await page.waitForSelector('.StudentTeamView', {timeout: 0});

        // Wait for first question
        await page.waitForSelector('.StudentTerm-text', {timeout: 0});
        const flippedAnswers = {};
        for (const i of Object.keys(this.answers)) {
            flippedAnswers[this.answers[i]] = i;
        }

        while ((await page.$('TeacherEndView-congratsHeadline')) === null) {
            const question = (await getText('.StudentPrompt-promptText', page)).trim().replace('>', '&gt').replace('<', '&lt');
            const answer = flippedAnswers[question];
            if (question) {
                const termEles = await page.$$('.StudentTerm-text');

                const terms = await Promise.all(termEles.map(async (ele) => (await getText(ele, page)).trim()));
                const termSpot = terms.indexOf(answer);
                if (termSpot > -1) {
                    try {
                        await termEles[termSpot].click();
                    } catch (e) {
                        console.log('Failed Click');
                    }
                }
                await delay(250);
            }
        }
        await page.close();

        console.log('The Game is done');
    }
}

export default Live;
