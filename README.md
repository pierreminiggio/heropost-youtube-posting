# heropost-youtube-posting

Prérequis :
Ceux de Puppeteer : https://github.com/puppeteer/puppeteer

Installation :
```
npm install pierreminiggio/heropost-youtube-posting
```

Utilisation : 
```javascript
import post from '@pierreminiggio/heropost-youtube-posting'

await post(
    'Heropost login or email',
    'Heropost password',
    'Youtube Channel Id',
    {
        title: 'Video title',
        description: 'Video description',
        categoryId: 27,
        videoFilePath: 'test.mp4'
    },
    config = {}
)
```
