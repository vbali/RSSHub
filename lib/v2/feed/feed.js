const parser = require('@/utils/rss-parser');
const config = require('@/config').value;
const got = require('@/utils/got');
const cheerio = require('cheerio');

let mercury_parser;

module.exports = async (ctx) => {
    const scheme = ctx.params.https || 'https';
    const cdn = config.wordpress.cdnUrl;

    const domain = `${scheme}://${ctx.params.domain}`;
    
    const feed = await parser.parseURL(`${domain}`);
    const items = await Promise.all(
        feed.items.map(async (item) => {
            const cache = await ctx.cache.get(item.link);
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }
            
            const parsed_result = await ctx.cache.tryGet(`mercury-cache-${item.link}`, async () => {
                // if parser failed, return default description and not report error
                try {
                    mercury_parser = mercury_parser || require('@postlight/mercury-parser');

                    const res = await got(item.link);
                    // const $ = cheerio.load(res.data, {
                    //     xmlMode: true,
                    // });
                    // const result = await mercury_parser.parse(item.link, {
                    //     html: $.html(),
                    // });
                    const result = await mercury_parser.parse(item.link);
                    
                    return result;
                } catch (e) {
                }
            });
                                         
            const description = item.description;
            const enclosure_url = item.enclosure ? item.enclosure.url ?? undefined : undefined;
            const enclosure_type = item.enclosure ? item.enclosure.type ?? undefined : undefined;
            
            const article = {
                title: item.title,
                description: parsed_result.content ?? description,
                pubDate: item.pubDate,
                link: item.link,
                author: item.creator,
                enclosure_url: enclosure_url,
                enclosure_type: enclosure_type,
            };
            return Promise.resolve(article);
        })
    );

    ctx.state.data = {
        title: feed.title,
        link: feed.link,
        description: feed.description,
        item: items,
    };
};
