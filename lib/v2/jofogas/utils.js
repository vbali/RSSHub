const got = require('@/utils/got');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const url = require('url');

async function load(link) {
    const response = await got({
        method: 'get',
        url: link,
        encoding: 'latin1',
    });
    const data = iconv.decode(response.data, 'iso-8859-2');
    const $ = cheerio.load(data);

    const variables = $('script')[18].children[0].data;    
    const dateRegex = /^date : \"(.*)\",/gm;
    const dateMatches = dateRegex.exec(variables);
    const authorRegex = /^name : \"(.*)\",/gm;
    const authorMatches = authorRegex.exec(variables);
    const priceRegex = /^price : \"(.*)\",/gm;
    const priceMatches = priceRegex.exec(variables);

    const image = $('div.main-content section.bigPic div#gallery_pic_0').attr("data-gallery-biggest-url");
    const productDescription = $('div.main-content div.description').text();

    let author
    let price
    let description = ""
    let pubDate = new Date().toISOString();
    if (dateMatches !== null && dateMatches.length >= 1 && dateMatches[1] !== undefined) {
        pubDate = dateMatches[1]
    }    
    if (authorMatches !== null && authorMatches.length >= 1 && authorMatches[1] !== undefined) {
        author = authorMatches[1]
        description += `<p><b>Eladó:</b> ${author}</p>`
    }
    if (priceMatches !== null && priceMatches.length >= 1 && priceMatches[1] !== undefined) {
        price = priceMatches[1]
        description += `<p><b>Ár:</b> ${price} Ft</p>`
    }
    if (image !== null && image !== undefined) {
        description += `<p><img src="${image}"/></p>`
    }
    if (productDescription !== null) {
        description += `<p>${productDescription}</p>`
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

            const productUrl = $("section.subjectWrapper > h3.item-title > a.subject", item).attr('href');
            const title = $("section.subjectWrapper > meta[itemprop=name]", item).attr('content');

            const single = {
                title: title,
                link: productUrl,
                guid: productUrl,
            };

            const other = await caches.tryGet(productUrl, async () => await load(productUrl));
            
            // console.log("jofogas.hu: " + single.title);
            return Promise.resolve(Object.assign({}, single, other));
        })
    );
}

const getData = async (ctx, url, title) => {
    const response = await got({
        method: 'get',
        url: url,
        encoding: 'latin1',
        headers: {
            Referer: url,
        },
    });

    const data = iconv.decode(response.data, 'iso-8859-2');
    const $ = cheerio.load(data);
    const list = $('div.search-list-container > div.list-items > div.list-item').get();    
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
