const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');
const host = 'https://moly.hu';

async function load(link) {
    const response = await got.get(link);
    const $ = cheerio.load(response.data);

    const title = $('div#content div.book_atom > h3.item > a.book_selector').text();
    const image = $('div#content div.shelf > div.book_with_shop > a > img').attr("src");
    const userImageContainer = $('div#content > div.copy > p:nth-of-type(3)');
    const author = $('div#content > h1 > a.user_selector').text();
    const infoTable = $('div#content > div.copy > table').html();
    const price = $('div#content p:nth-of-type(2) span').text();

    let description = ""
    if (price !== null) {
        description += `<p>Ár: ${price}</p>`
    }
    if (author !== null) {
        description += `<p>Eladó: ${author}</p>`
    }
    if (image !== null && image !== undefined) {
        description += `<p><img src="${url.resolve(host, image)}"/></p>`
    }
    if (userImageContainer !== null && userImageContainer !== undefined) {
        userImage = $('img', userImageContainer).attr("src");
        if (userImage !== null && userImage !== undefined) {
            description += `<p><img src="${url.resolve(host, userImage)}"/></p>`
        }
    }
    if (infoTable !== null) {
        description += `<p>${infoTable}</p>`
    }
    const pubDate = new Date().toISOString();
    
    return {
        title,
        author,
        description,
        pubDate,
    };
}

async function ProcessFeed(list, caches) {
    return await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);

            const productUrlPath = $("a.jump.button_icon.right.tooltip", item).attr('href');
            const productUrl = url.resolve(host, productUrlPath);
            
            const single = {
                link: productUrl,
                guid: productUrl,
            };

            const other = await caches.tryGet(productUrl, async () => await load(productUrl));

            // console.log("moly.hu: " + other.title);
            return Promise.resolve(Object.assign({}, single, other));
        })
    );
}

const getData = async (ctx, url, title) => {
    const response = await got({
        method: 'get',
        url: url,
    });

    const data = response.data;

    const $ = cheerio.load(data);
    const list = $('div#content > div.copy').get();

    const result = await ProcessFeed(list, ctx.cache);

    return {
        title: title,
        link: url,
        description: $('meta[name="description"]').attr('content'),
        allowEmpty: true,
        item: result,
    };
};

module.exports = {
    getData,
};
