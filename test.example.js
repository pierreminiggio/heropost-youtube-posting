// Copy this file to test.js
// You can then test using npm test

import post from './index.js'

(async () => {
    console.log(await post(
        'Heropost login or email',
        'Heropost password',
        'Youtube channel id',
        {
            title: 'vidéo automatique test',
            description: 'description automatique test',
            categoryId: 27
        },
        {show: true}
    ))
})()
