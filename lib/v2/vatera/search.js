const utils = require('./utils');
const he = require('he');

module.exports = async (ctx) => {
    const search = ctx.params.search;
    const categoryId = ctx.params.categoryId;
    const url = `https://www.vatera.hu/konyv/index-c${categoryId}.html?q=${search}&ob=5&obd=2`;
    const searchText = he.decode(search);
    
    const title = `Vatera - ${searchText}`;

    ctx.state.data = await utils.getData(ctx, url, title);
};
