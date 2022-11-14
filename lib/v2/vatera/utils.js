const got = require('@/utils/got');
const cheerio = require('cheerio');
const url = require('url');

async function load(link) {
    const response = await got.get(link);
    const $ = cheerio.load(response.data);

    const image = $('div#photo-zoom-container > div#photo-panel ul#item-Gallery > li').first().attr("data-src");
    const author = $('div.seller-box-wrap > div.user_rate span.userrating > a').first().text();
    const productDescription = $('div.row.itemblock div#description-panel').html();
    const currentPrice = $('div#buy_bid_container div.bid-box div.ar2-container').html();
    const fixPrice = $('div#buy_bid_container div.buynow-box div.ar2-container').html();
    const huDate = $('div#basic-info-panel > div.row > div.prod_col:contains("Aukció kezdete")').next().text().trim();
    const date = huDate.replace(/(\d{4}).(\d{1,2}).(\d{1,2}). (.*)/, "$1-$2-$3 $4");

    let description = ""
    let pubDate = new Date().toISOString();
    if (fixPrice !== null) {
        description += `<p>${fixPrice}</p>`
    }
    if (currentPrice !== null) {
        description += `<p>${currentPrice}</p>`
    }
    if (author !== null) {
        description += `<p>Eladó: ${author}</p>`
    }
    if (image !== null) {
        description += `<p><img src="${image}"/></p>`
    }
    if (productDescription !== null) {
        description += `<p>${productDescription}</p>`
    }
    if (date.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        pubDate = date
    }
    

    return {
        author,
        description,
        pubDate,
    };
}

async function ProcessFeed(list, caches) {
    return await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);

            const productUrl = $("a.product_link", item).attr('href');
            const title = $("a.product_link > div.toptext", item).text().trim();

            const single = {
                title: title,
                link: productUrl,
                guid: productUrl,
            };

            const other = await caches.tryGet(productUrl, async () => await load(productUrl));

            // console.log("vatera.hu: " + single.title);
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
    const list = $('div.prodlist.list > div.list-items div.prod-inner-container > div.row').get();

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
