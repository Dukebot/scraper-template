const scraper = require('./scraper')

class Scraper {
    constructor(launchOptions, proxy) {
        if (!launchOptions) {
            launchOptions = this.puppeteerDefaultLaunchOptions()
        }

        if (proxy) {
            if (!proxy.url || !proxy.username || !proxy.password) {
                throw new Error('Wrong proxy object. It must contain properties url, username and password!')
            }

            if (!launchOptions.args) launchOptions.args = []
            launchOptions.args.push(`--proxy-server=${proxy.url}`)
        }

        this._launchOptions = launchOptions
        this._proxy = proxy

        console.log('new scraper', this.launchOptions)
    }

    get launchOptions() {
        return this._launchOptions
    }

    get proxy() {
        return this._proxy
    }

    puppeteerDefaultLaunchOptions() {
        return scraper.puppeteerDefaultLaunchOptions()
    }

    puppeteerDefaultArgs() {
        return scraper.puppeteerDefaultArgs()
    }

    async botTest() {
        return scraper.botTest()
    }

    async scrape(scrapingFunction) {
        return scraper.scrape(scrapingFunction, this.launchOptions)
    }

    // BROWSER

    async newBrowser() {
        return scraper.newBrowser(this.launchOptions)
    }

    async closeBrowser(browser) {
        return scraper.closeBrowser(browser)
    }

    async getPages(browser) {
        return scraper.getPages(browser)
    }

    async getDefaultPage(browser) {
        return scraper.getDefaultPage(browser)
    }

    async newPage(browser) {
        return scraper.newPage(browser, this.proxy)
    }

    // PAGE

    disableWebdriver(page) {
        return scraper.disableWebdriver(page)
    }

    async goTo(page, url) {
        return scraper.goTo(page, url)
    }

    async getCookies(page) {
        return scraper.getCookies(page)
    }

    async setCookies(page, cookies) {
        return scraper.setCookies(page, cookies)
    }

    async getLocalStorage(page) {
        return scraper.getLocalStorage(page)
    }

    async setLocalStorage(page, localStorage) {
        return scraper.setLocalStorage(page, localStorage)
    }

    async pressLoadMoreButton(page, query, maxButtonPresses, minWaitTime, maxWaitTime) {
        return scraper.pressLoadMoreButton(page, query, maxButtonPresses, minWaitTime, maxWaitTime)
    }

    async autoScroll(page) {
        return scraper.autoScroll(page)
    }

    // UTILS

    async wait(timeMilliseconds) {
        return scraper.wait(timeMilliseconds)
    }

    async waitRandom(minTimeMs, maxTimeMs) {
        return scraper.waitRandom(minTimeMs, maxTimeMs)
    }

    arrayChunk(array, chunkSize) {
        return scraper.arrayChunk(array, chunkSize)
    }
}

module.exports = Scraper