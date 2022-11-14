const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');

async function load(link) {
    const response = await got.get(link);
    const $ = cheerio.load(response.data);

    const title = $('main.main_content h1').text().trim();
    const content = $('article.content').html();
    const author = $('section.article-item span.author').text().trim();
    const huDate = $('section.article-item span.text-gray').text().trim();
    const date = huDate.replace(/(\d{4}).(\d{1,2}).(\d{1,2}). (.*)/, "$1-$2-$3 $4");
    
    let description = "<article>"
    let pubDate = new Date().toISOString();
    
    if (date.match(/\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}/)) {
        pubDate = date + ":00"
    }
    if (content !== null && content !== undefined) {
        description += content
    }
    description += "</article>";
    
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

            // console.log("egriugyek.hu: " + single.link);
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

    let list = [];
    $('section.article-list article.article-item h2 > a').each((_, anchor) => {
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
