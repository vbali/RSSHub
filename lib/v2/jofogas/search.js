const utils = require('./utils');
const he = require('he');

module.exports = async (ctx) => {
    const search = ctx.params.search;
    const category = ctx.params.category;
    let url = `https://www.jofogas.hu/magyarorszag/`
    if (category !== undefined) {
        url += category
    }
    url += '?q=' + search
    console.log(url);
    const searchText = he.decode(search);
    
    const title = `Jófogás - ${searchText}`;

    ctx.state.data = await utils.getData(ctx, url, title);
};
