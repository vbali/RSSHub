const got = require('@/utils/got');
const parser = require('@/utils/rss-parser');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('https://f1vilag.hu/feed/');

    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const response = await got(item.link);

                const $ = cheerio.load(response.data);

                const excerpt = $('[data-widget_type="theme-post-excerpt.default"]');
                const featuredImage = $('[data-widget_type="theme-post-featured-image.default"]')
                const content = $('[data-widget_type="theme-post-content.default"]');
                
                content.find('#bsa-html').remove();
                content.find('script').remove();
                
                console.log(content);
                
                let description = `
                <article>
                    ${excerpt ? excerpt.html() : ""}
                    ${featuredImage ? featuredImage.html() : ""}
                    ${content ? content.html() : ""}
                </article>`

                item.description = description;

                return item;
            })
        )
    );

    ctx.state.data = {
        title: feed.title,
        link: feed.link,
        description: feed.description,
        item: items,
    };
};
