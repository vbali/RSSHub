const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');

async function load(link) {
    const response = await got.get(link);
    const $ = cheerio.load(response.data);

    $('div.hird-cikkozi').remove();
    $('div.hird-cikkzaro').remove();
    const title = $('head title').text().trim().replace('| EgerHírek', '');
    const content = $('div#mvp-post-content-mid > section#mvp-content-main').html();
    const image = $('div#mvp-post-content-mid img.wp-post-image').attr("src");
    const videoEmbed = $('div#mvp-post-content-mid div#mvp-video-embed').html()
    const author = $('div#mvp-post-content-mid > header#mvp-post-head div#mvp-post-author span.author-name').text().trim();
    const huDate = $('div#mvp-post-content-mid > header#mvp-post-head div#mvp-post-date span.post-date').text().trim();
    const date = huDate.replace(/(\d{4}).(\d{1,2}).(\d{1,2})  - (.*)/, "$1-$2-$3 $4");
    
    
    
    let description = "<article>"
    let pubDate = new Date().toISOString();
    if (image !== null && image !== undefined) {
        description += `<p><img src="${image}" /></p><br/>`;
    }
    if (videoEmbed !== null && videoEmbed !== undefined) {
        description += `<div>${videoEmbed}</div>`;
    }
    if (content !== null && content !== undefined) {
        description += content
    }
    description += "</article>";

    if (date.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
        pubDate = date + ":00"
    }
    
    // console.log(`Link: ${link}`);
    // console.log(`Title: ${title}`);
    // console.log(`Date: ${pubDate}`);
    // console.log(`Author: ${author}`);
    // console.log(`Content: ${description}`);
    // console.log(`=============`);

    return {
        title,
        author,
        description,
        pubDate,
    };
}

async function ProcessFeed(list, caches) {
    return await Promise.all(
        list.map(async (itemUrl) => {
            const single = {
                link: itemUrl,
                guid: itemUrl,
            };

            const other = await caches.tryGet(itemUrl, async () => await load(itemUrl));

            // console.log("egerhirek.hu: " + single.link);
            return Promise.resolve(Object.assign({}, single, other));
        })
    );
}

const getData = async (ctx, url, title) => {
    const response = await got({
        method: 'get',
        url: url,
        headers: {
            Referer: url,
        },
    });

    const data = response.data;
    const $ = cheerio.load(data);
    
    // console.log("egerhirek.hu: " + url);
    let list = [];
    $('ul.mvp-main-blog-story > li.infinite-post div.mvp-main-blog-out > a').each((_, anchor) => {
        let item = $(anchor).attr('href');
        list.push(item);
    });
    
    const result = await ProcessFeed(list, ctx.cache);

    return {
        title: title,
        link: url,
        description: $('meta[name="description"]').attr('content'),
        item: result,
    };
};

module.exports = {
    getData,
};
