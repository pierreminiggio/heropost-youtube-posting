import loginToHeropost from '@pierreminiggio/heropost-login'
import puppeteer from 'puppeteer'
import setDefault from '@pierreminiggio/set-default-value-for-key-in-object'

const videoCategories = {
    'Film & Animation': 1,
    'Autos & Vehicles': 2,
    'Music': 10,
    'Pets & Animals': 15,
    'Sports': 17,
    'Travel & Events': 19,
    'Gaming': 20,
    'People & Blogs': 22,
    'Comedy': 23,
    'Entertainment': 24,
    'News & Politics': 25,
    'Howto & Style': 26,
    'Education': 27,
    'Science & Technology': 28,
    'Nonprofits & Activism': 29
}

/**
 * 
 * @typedef {Object} YoutubeVideo
 * @property {string} title
 * @property {string} description
 * @property {number} categoryId
 * 
 * @typedef {Object} HeropostYoutubePostingConfig
 * @property {boolean} show default false
 * 
 * @param {string} login
 * @param {string} password
 * @param {string} channelId
 * @param {YoutubeVideo} video
 * @param {HeropostYoutubePostingConfig} config
 * 
 * @returns {Promise}
 */
export default function (login, password, channelId, video, config = {}) {

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
                throw new Error('Channel ' + channelId + ' not set up on heropost account')
            }

            try {
                await page.evaluate(channelIdInListSelector => {
                    document.querySelector(channelIdInListSelector + ' input').click()
                }, channelIdInListSelector)
            } catch (error) {
                throw new Error('Scraping error : Checkbox for channel ' + channelId + ' is missing !')
            }

            const titleInputSelector = '[name="advance[title]"]'
            try {
                await page.waitForSelector(titleInputSelector)
            } catch (error) {
                throw new Error('Scraping error : Title input selector is missing !')
            }

            await page.evaluate((titleInputSelector, title) => {
                document.querySelector(titleInputSelector).value = title
            }, titleInputSelector, video.title)

            const categorySelectSelector = '[name="advance[category]"]'
            try {
                await page.waitForSelector(categorySelectSelector)
            } catch (error) {
                throw new Error('Scraping error : Category Select selector is missing !')
            }

            await page.evaluate((categorySelectSelector, categoryId) => {
                document.querySelector(categorySelectSelector).value = categoryId
            }, categorySelectSelector, video.categoryId)
 
            console.log('yeay')

            resolve()
        } catch (e) {
            reject(e)
        }
    })
}
