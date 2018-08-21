import {ElementHandle, Page} from "puppeteer";

async function getText(ele: ElementHandle | string, page: Page): Promise<string> {
    if (!page) throw noPage();
    let handle;
    if (typeof ele === 'string') {
        handle = await page.$(ele);
    } else {
        handle = ele;
    }
    return await page.evaluate((element) => {
        return element.innerText;
    }, handle);
}

function noPage(): Error {
    return new Error('No Page!!');
}

function delay(ms: number) {
    return new Promise( (resolve) => setTimeout(resolve, ms) );
}
async function prompt(question): Promise<string> {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    return new Promise<string>((resolve) => {
        stdin.once('data', (data) => resolve(data.toString().trim()));
    });
}

export {delay, getText, noPage, prompt}