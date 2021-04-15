import loginToHeropost from '@pierreminiggio/heropost-login'
import puppeteer from 'puppeteer'
import setDefault from '@pierreminiggio/set-default-value-for-key-in-object'

/**
 * @typedef {Object} HeropostYoutubePostingConfig
 * @property {boolean} show default false
 * 
 * @param {string} login
 * @param {string} password
 * @param {HeropostYoutubePostingConfig} config
 * 
 * @returns {Promise}
 */
export default function (login, password, config = {}) {

    return new Promise(async (resolve, reject) => {
        
        setDefault(config, 'show', false)

        let browser
        
        try {
            browser = await puppeteer.launch({
                headless: false,
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

            resolve()
        } catch (e) {
            reject(e)
        }
    })
}
