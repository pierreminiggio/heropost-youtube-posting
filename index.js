import loginToHeropost from '@pierreminiggio/heropost-login'
import puppeteer from 'puppeteer'
import setDefault from '@pierreminiggio/set-default-value-for-key-in-object'
import getToastMessage from '@pierreminiggio/heropost-toast-message-getter'
import type from '@pierreminiggio/puppeteer-text-typer'

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
 * @property {string} videoFilePath
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

        if (! Object.values(videoCategories).includes(video.categoryId)) {
            reject('Bad category id')
            return
        }
        
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
            const youtubePostPage = 'https://dashboard.heropost.io/youtube_post'
            await page.goto(youtubePostPage)

            const channelIdInListSelector = '[data-pid="' + channelId + '"]'

            try {
                await page.waitForSelector(channelIdInListSelector)
            } catch (error) {
                throw new Error('Heropost/Youtube error : Channel ' + channelId + ' not set up on heropost account or Youtube quota exceeded')
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
 
            const descriptionInputSelector = '.emojionearea-editor'
            try {
                await page.waitForSelector(descriptionInputSelector)
            } catch (error) {
                throw new Error('Scraping error : Description input selector is missing !')
            }

            await type(page, descriptionInputSelector, video.description)

            const videoInputSelector = '#upload_video'

            try {
                await page.waitForSelector(videoInputSelector)
            } catch (error) {
                throw new Error('Scraping error : Video file input selector is missing !')
            }

            await page.waitForTimeout(3000)

            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click('.fileinput-button')
            ])
            
            await fileChooser.accept([video.videoFilePath])

            const fileStatusMessage = await getToastMessage(page)
            
            if (fileStatusMessage !== 'File saved') {
                throw new Error('File could not be saved :' + fileStatusMessage)
            }

            const postButtonSelector = '.btn-post-now'
            try {
                await page.waitForSelector(postButtonSelector)
            } catch (error) {
                throw new Error('Scraping error : Post button selector is missing !')
            }

            await page.waitForTimeout(10000)

            await page.click(postButtonSelector)

            const uploadStatusMessage = await getToastMessage(page)

            if (uploadStatusMessage.includes('quota')) {
                throw new Error('Heropost/Youtube error : Quota exceeded !')
            }

            if (! uploadStatusMessage.includes('Content is being published')) {
                throw new Error('Heropost/Youtube error : Unknow error while posting')
            }

            await page.goto(youtubePostPage)

            const bellButtonSelector = 'a[data-original-title="Schedule history"]'

            try {
                await page.waitForSelector(bellButtonSelector)
            } catch (error) {
                throw new Error('Scraping error : Bell button selector is missing !')
            }

            await page.click(bellButtonSelector)

            const postedItemSelector = '.item.search-schedule'
            try {
                await page.waitForSelector(postedItemSelector)
            } catch (error) {
                throw new Error('Scraping error : Posted item selector is missing !')
            }

            const successStatusSelector = postedItemSelector + ' .status.text-success'
            try {
                await page.waitForSelector(successStatusSelector)
            } catch (error) {
                throw new Error('Heropost/Youtube error : Youtube API returned an error ?')
            }

            const videoLinkSelector = successStatusSelector + ' a'
            try {
                await page.waitForSelector(videoLinkSelector)
            } catch (error) {
                throw new Error('Heropost/Youtube error : Video link not found ?')
            }

            const link = await page.evaluate(videoLinkSelector => {
                return document.querySelector(videoLinkSelector).href
            }, videoLinkSelector)

            await browser.close()

            resolve(link)
        } catch (e) {
            await browser.close()
            reject(e)
        }
    })
}
