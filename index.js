import loginToHeropost from '@pierreminiggio/heropost-login'
// import puppeteer from 'puppeteer'
import { element2selector } from 'puppeteer-element2selector'
import setDefault from '@pierreminiggio/set-default-value-for-key-in-object'
// import getToastMessage from '@pierreminiggio/heropost-toast-message-getter'
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
 * @param {string} channelTag // @yourYoutubeTag
 * @param {YoutubeVideo} video
 * @param {HeropostYoutubePostingConfig} config
 * 
 * @returns {Promise}
 */
export default function (login, password, channelTag, video, config = {}) {

    return new Promise(async (resolve, reject) => {

        if (! Object.values(videoCategories).includes(video.categoryId)) {
            reject('Bad category id')
            return
        }
        
        setDefault(config, 'show', false)

        let browser
        try {
            const page = await loginToHeropost(login, password, {
                headless: ! config.show
            })
            browser = page.browser()

            const socialMediaTabContainerSelector = '.MuiTabs-flexContainer'
            await page.waitForSelector(socialMediaTabContainerSelector)

            await page.evaluate(socialMediaTabContainerSelector => {
                const socialMediaTabButtons = document.querySelectorAll(socialMediaTabContainerSelector + '>*')

                for (const socialMediaTabButton of socialMediaTabButtons) {
                    const socialMediaInnerText = socialMediaTabButton.innerText.trim()

                    if (socialMediaInnerText === 'YouTube') {
                        socialMediaTabButton.click()
                        break
                    }
                }
            }, socialMediaTabContainerSelector)

            await page.waitForTimeout(1000)

            const potentialSuccess = await page.evaluate(channelTag => {
                const channelImages = document.querySelectorAll('img[alt^="@"]')

                let foundChannel = false

                for (const channelImage of channelImages) {
                    const channelImageAlt = channelImage.alt

                    const isMatchingChannelTag = channelImageAlt === channelTag
                    if (isMatchingChannelTag) {
                        foundChannel = true
                    }


                    const isSupposedToBeSelected = isMatchingChannelTag

                    const parentToImage = channelImage.parentElement
                    if (! parentToImage) {
                        return false
                    }

                    const isSelected = parentToImage.classList.contains('AccountSelectorItem__ImageContainer__Avatar--selected')

                    if (isSelected === isSupposedToBeSelected) {
                        continue
                    }

                    const channelSelectorButton = parentToImage.parentElement
                    if (! channelSelectorButton) {
                        return false
                    }

                    channelSelectorButton.click()
                }

                return foundChannel
            }, channelTag)

            if (! potentialSuccess) {
                const errorMessage = 'Channel not found for tag ' + channelTag
                throw Error(errorMessage)
            }

            await page.waitForTimeout(1000)

            const lavelElementsSelector = '.MuiInputLabel-root'
            const labelElements = await page.$$(lavelElementsSelector)
            
            let filledTitle = false
            let filledDescription = false
            let filledCategory = false

            const fillInputText = async (labelElement, valueToInput) => {
                const labelElementSelector = await element2selector(labelElement)
                const inputElementSelector = labelElementSelector + '+*>*'
    
                await page.waitForSelector(inputElementSelector)
                const currentInputValue = await page.evaluate(inputElementSelector => document.querySelector(inputElementSelector).value, inputElementSelector)

                if (currentInputValue) {
                    await page.focus(inputElementSelector)
                }
                
                for (let i = 0; i < currentInputValue.length; i++) {
                    await page.keyboard.press('Backspace');
                }

                await type(page, inputElementSelector, valueToInput)
            }

            for (const labelElementId in labelElements) {
                const labelElement = labelElements[labelElementId]
                const labelElementInnerText = await page.evaluate(labelElement => labelElement.innerText, labelElement)

                if (! labelElementInnerText) {
                    continue
                }

                if (labelElementInnerText === 'Title') {
                    await fillInputText(labelElement, video.title)

                    filledTitle = true
                    continue
                }

                if (labelElementInnerText === 'Description') {
                    await fillInputText(labelElement, video.description)

                    filledDescription = true
                    continue
                }

                if (labelElementInnerText === 'Category') {
                    const labelElementSelector = await element2selector(labelElement)
                    const selectElementSelector = labelElementSelector + '+*>*'
        
                    await page.waitForSelector(selectElementSelector)
                    await page.click(selectElementSelector)

                    const selectItemSelector = '.MuiMenuItem-root'
                    await page.waitForSelector(selectItemSelector)

                    await page.waitForTimeout(1000)

                    const selectItemToClickSelector = selectItemSelector + '[data-value="' + video.categoryId + '"]'
                    await page.click(selectItemToClickSelector)

                    filledCategory = true
                    continue
                }
            }

            await page.waitForTimeout(90000)
            await page.waitForTimeout(90000)
            await page.waitForTimeout(90000)

            // try {
            //     await page.evaluate(channelIdInListSelector => {
            //         document.querySelector(channelIdInListSelector + ' input').click()
            //     }, channelIdInListSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Checkbox for channel ' + channelId + ' is missing !')
            // }

            // const titleInputSelector = '[name="advance[title]"]'
            // try {
            //     await page.waitForSelector(titleInputSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Title input selector is missing !')
            // }

            // await page.evaluate((titleInputSelector, title) => {
            //     document.querySelector(titleInputSelector).value = title
            // }, titleInputSelector, video.title)

            // const categorySelectSelector = '[name="advance[category]"]'
            // try {
            //     await page.waitForSelector(categorySelectSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Category Select selector is missing !')
            // }

            // await page.evaluate((categorySelectSelector, categoryId) => {
            //     document.querySelector(categorySelectSelector).value = categoryId
            // }, categorySelectSelector, video.categoryId)
 
            // const descriptionInputSelector = '.emojionearea-editor'
            // try {
            //     await page.waitForSelector(descriptionInputSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Description input selector is missing !')
            // }

            // await type(page, descriptionInputSelector, video.description)

            // const videoInputSelector = '#upload_video'

            // try {
            //     await page.waitForSelector(videoInputSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Video file input selector is missing !')
            // }

            // await page.waitForTimeout(3000)

            // const [fileChooser] = await Promise.all([
            //     page.waitForFileChooser(),
            //     page.click('.fileinput-button')
            // ])
            
            // await fileChooser.accept([video.videoFilePath])

            // const fileStatusMessage = await getToastMessage(page)
            
            // if (fileStatusMessage !== 'File saved') {
            //     throw new Error('File could not be saved :' + fileStatusMessage)
            // }

            // const postButtonSelector = '.btn-post-now'
            // try {
            //     await page.waitForSelector(postButtonSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Post button selector is missing !')
            // }

            // await page.waitForTimeout(10000)

            // await page.click(postButtonSelector)

            // const uploadStatusMessage = await getToastMessage(page)

            // if (uploadStatusMessage.includes('quota')) {
            //     throw new Error('Heropost/Youtube error : Quota exceeded !')
            // }

            // if (! uploadStatusMessage.includes('Content is being published')) {
            //     throw new Error('Heropost/Youtube error : Unknow error while posting')
            // }

            // await page.goto(youtubePostPage)

            // const bellButtonSelector = 'a[data-original-title="Schedule history"]'

            // try {
            //     await page.waitForSelector(bellButtonSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Bell button selector is missing !')
            // }

            // await page.click(bellButtonSelector)

            // const postedItemSelector = '.item.search-schedule'
            // try {
            //     await page.waitForSelector(postedItemSelector)
            // } catch (error) {
            //     throw new Error('Scraping error : Posted item selector is missing !')
            // }

            // const successStatusSelector = postedItemSelector + ' .status.text-success'
            // try {
            //     await page.waitForSelector(successStatusSelector)
            // } catch (error) {
            //     throw new Error('Heropost/Youtube error : Youtube API returned an error ?')
            // }

            // const videoLinkSelector = successStatusSelector + ' a'
            // try {
            //     await page.waitForSelector(videoLinkSelector)
            // } catch (error) {
            //     throw new Error('Heropost/Youtube error : Video link not found ?')
            // }

            // const link = await page.evaluate(videoLinkSelector => {
            //     return document.querySelector(videoLinkSelector).href
            // }, videoLinkSelector)

            // await browser.close()

            // resolve(link)
        } catch (e) {
            if (browser) {
                await browser.close()
            }
            reject(e)
        }
    })
}
