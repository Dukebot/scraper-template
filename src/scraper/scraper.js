// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// Puppeteer-extra plugins
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua')

// require executablePath from puppeteer
const { executablePath } = require('puppeteer')

// Tell puppeteer-extra to use the plugins
puppeteer.use(StealthPlugin())
puppeteer.use(AnonymizeUA())

/**
 * Returns an object with the default puppeteer launch options
 * @returns {object} default puppeteer launch options
 */
function puppeteerDefaultLaunchOptions() {
    return {
        // Launch browser without GUI
        headless: true,
        // Ignore default puppeteer launch args to make the browser appear more natural
        ignoreDefaultArgs: [
            // disables browser extensions which makes the browser appear unnatural.
            '--disable-extensions',
            // disables installation of default browser apps when starting a new tab.
            '--disable-default-apps',
            // disables default browser extensions which use background pages.
            '--disable-component-extensions-with-background-pages'
        ],
        // If using puppeteer-extra we must pass the executabePath
        executablePath: executablePath(),
    }
}

/**
 * Get's the default args when launching puppeteer
 * @returns {array} List of default args
 */
function puppeteerDefaultArgs() {
    return puppeteer.defaultArgs()
}

/**
 * Executes a scraping function handling the browser logic
 * @param {function} scrapingFunction 
 * @returns return value of the scraping function
 */
async function scrape(scrapingFunction, launchOptions) {
    const browser = await newBrowser(launchOptions)
    try {
        return await scrapingFunction(browser)
    } catch (error) {
        throw error
    } finally {
        await closeBrowser(browser)
    }
}

/**
 * Tests if our scraper it's not detected as a headless chrome.
 * It makes a screenshoot of the page with the result.
 */
async function botTest() {
    await puppeteer.launch({
        headless: true,
        executablePath: executablePath()
    }).then(async browser => {
        console.log('Check the bot tests..')
        const page = await getDefaultPage(browser)

        await page.goto('https://bot.sannysoft.com')
        await wait(5000)
        await page.screenshot({ path: 'bot-test-result.png', fullPage: true })

        await browser.close()
        console.log(`All done, check the bot result screenshot. `)
    });
}

// BROWSER

/**
 * Launches puppeteer browser
 * @param {object} launchOptions 
 */
async function newBrowser(launchOptions) {
    if (!launchOptions) {
        console.log('using default puppeteer launch options')
        launchOptions = puppeteerDefaultLaunchOptions()
    } else {
        console.log('using custom puppeteer launch options')
    }
    console.log('puppeteer launch options', launchOptions)

    return puppeteer.launch(launchOptions)
}

/**
 * Ends the browser execution
 * @param {object} browser
 * @return {promise}
 */
async function closeBrowser(browser) {
    return browser.close()
}

/**
 * Create a new page with the current browser
 * @param {object} browser
 * @param {object} proxy
 * @returns {object} Page
 */
async function newPage(browser, proxy) {
    const page = await browser.newPage()
    disableWebdriver(page)
    if (proxy) {
        await page.authenticate({ username: proxy.username, password: proxy.password })
    }
    return page
}

/**
 * Returns an array with all pages that have been opened by the browser
 * @param {object} browser 
 * @returns {promise} array of pages
 */
async function getPages(browser) {
    return browser.pages()
}

/**
 * Returns the first page of the browser which is opened by default
 * when creating a new browser instance
 * @param {object} browser 
 * @returns {object} page
 */
async function getDefaultPage(browser) {
    return (await browser.pages())[0]
}

// PAGE

/**
 * Adds a getter to always return false when reading the property 'webdriver'.
 * This is to hide the scraper since when scraping with puppeteer this is always 'true'
 * while on a normal navigatior the usual value is 'false'.
 * @param {object} page 
 */
function disableWebdriver(page) {
    const script = "Object.defineProperty(navigator, 'webdriver', {get: () => false})"
    page.evaluateOnNewDocument(script)
}

/**
 * Navigates to the given url
 * @param {object} page 
 * @param {string} url
 */
async function goTo(page, url) {
    await page.goto(url)
    await page.waitForSelector('body')
    console.log('Navigated to ' + url)
}

/**
 * Get's page cookies
 * @param {object} page 
 * @returns {} page cookies
 */
async function getCookies(page) {
    return page.cookies()
}

/**
 * Set's page cookies
 * @param {object} page 
 * @param {string|object} cookies 
 * @returns {promise}
 */
async function setCookies(page, cookies) {
    deserializedCookies = cookies
    if (typeof deserializedCookies === 'string') {
        deserializedCookies = JSON.parse(deserializedCookies)
    }
    return page.setCookie(...deserializedCookies);
}

/**
 * Get's page localStorage
 * @param {object} page 
 * @returns {promise} local storage data
 */
async function getLocalStorage(page) {
    return page.evaluate(() => JSON.stringify(window.localStorage));
}

/**
 * Set's localStorage data to the page
 * @param {object} page 
 * @param {string|object} localStorage 
 * @returns {promise}
 */
async function setLocalStorage(page, localStorage) {
    deserializedStorage = localStorage
    if (typeof deserializedStorage === 'string') {
        deserializedStorage = JSON.parse(deserializedStorage)
    }

    return page.evaluate(deserializedStorage => {
        for (const key in deserializedStorage) {
            localStorage.setItem(key, deserializedStorage[key]);
        }
    }, deserializedStorage);
}

/**
 * Presses the load more button a given amount of times to display all articles in the table.
 * @param {object} page Page to evaluate
 * @param {string} query Selector for button ie: '#loadMoreButton'
 * @param {number} maxButtonPresses Max number of times the button will be pressed
 * @param {number} minWaitTime Min wait time for each button press
 * @param {number} maxWaitTime Max wait time for each button press
 */
async function pressLoadMoreButton(
    page,
    query,
    maxButtonPresses,
    minWaitTime = 2000,
    maxWaitTime = 4000
) {
    const getLoadMoreButton = async () => page.$(query);

    let i = 0;
    let loadMoreButton = await getLoadMoreButton();

    // FIXME for some reason the while never ends even if there are no more articles to load
    while (loadMoreButton) {
        await loadMoreButton.evaluate(loadMoreButton => loadMoreButton.click());

        i++
        if (i >= maxButtonPresses)
            break

        await waitRandom(minWaitTime, maxWaitTime);
        loadMoreButton = await getLoadMoreButton();
    }
}

/**
 * Scrolls to the bottom of the page
 * @param {object} page 
 * @returns {promise}
 */
async function autoScroll(page) {
    return page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;

            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// UTILS

/**
 * Returns a promise that resolve after a given amount of time.
 * Very usefull when we want to delay the execution for a certain time.
 * @param {number} timeMilliseconds 
 * @returns {promise} Promise
 */
async function wait(timeMilliseconds) {
    return new Promise(resolve => setTimeout(resolve, timeMilliseconds))
}

/**
 * Waits a random amount of time between two values
 * @param {number} minTimeMs 
 * @param {number} maxTimeMs 
 * @returns 
 */
async function waitRandom(minTimeMs, maxTimeMs) {
    return wait(getRandomInt(minTimeMs, maxTimeMs))

    function getRandomInt(min, max) {
        return min + Math.floor(Math.random() * max)
    }
}

/**
 * Groups array items into chunks. 
 * @param {array} array 
 * @param {number} chunkSize 
 * @returns {array} array chunked
 */
function arrayChunk(array, chunkSize) {
    const arrayChunks = []

    let chunkIndex = 0
    for (let i = 0; i < array.length; i++) {
        if (i === 0) arrayChunks[chunkIndex] = []
        if (i > 0 && i % chunkSize === 0) {
            chunkIndex++
            arrayChunks[chunkIndex] = []
        }
        arrayChunks[chunkIndex].push(array[i])
    }

    return arrayChunks
}


/**
 * Wrapper for puppeteer and it's plugins.
 * Contains functions to make scraping more simple.
 */
const Scraper = {
    puppeteerDefaultLaunchOptions,
    puppeteerDefaultArgs,
    scrape,
    botTest,

    // browser
    newBrowser,
    closeBrowser,
    getPages,
    getDefaultPage,
    newPage,
    
    // page
    disableWebdriver,
    goTo,
    getCookies,
    setCookies,
    getLocalStorage,
    setLocalStorage,
    pressLoadMoreButton,
    autoScroll,

    // utils
    wait,
    waitRandom,
    arrayChunk,
}

module.exports = Scraper