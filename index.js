import loginToHeropost from '@pierreminiggio/heropost-login'
import puppeteer from 'puppeteer'
import setDefault from '@pierreminiggio/set-default-value-for-key-in-object'

/**
 * @typedef {Object} HeropostYoutubePostingConfig
 * @property {boolean} show default false
 * 
 * @param {string} login
 * @param {string} password
 * @param {string} channelId
 * @param {HeropostYoutubePostingConfig} config
 * 
 * @returns {Promise}
 */
export default function (login, password, channelId, config = {}) {

    return new Promise(async (resolve, reject) => {
        
        setDefault(config, 'show', false)

        let browser
        
        try {
            browser = await puppeteer.launch({
                headless: ! config.show,
                args: [
                    '--disable-notifications',
                    '--no-sandbox'
                ]
            })
        } catch(error) {
            reject(e)
            return
        }
        
        const page = await browser.newPage()

        try {
            await loginToHeropost(page, login, password)
            await page.goto('https://dashboard.heropost.io/youtube_post')

            const channelIdInListSelector = '[data-pid="' + channelId + '"]'

            try {
                await page.waitForSelector(channelIdInListSelector)
            } catch (error) {
                reject('Channel ' + channelId + ' not set up on heropost account')
                return
            }

            try {
                await page.evaluate(channelIdInListSelector => {
                    document.querySelector(channelIdInListSelector + ' input').click()
                }, channelIdInListSelector)
            } catch (error) {
                reject('Scraping error : Checkbox for channel ' + channelId + ' is missing !')
                return
            }
 
            console.log('yeay')

            resolve()
        } catch (e) {
            reject(e)
        }
    })
}
