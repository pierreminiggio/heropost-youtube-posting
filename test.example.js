// Copy this file to test.js
// You can then test using npm test

import post from './index.js'

(async () => {
    console.log(await post(
        'Heropost login or email',
        'Heropost password',
        'Youtube channel id',
        {show: true}
    ))
})()
