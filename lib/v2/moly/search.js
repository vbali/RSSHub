const utils = require('./utils');
const he = require('he');

module.exports = async (ctx) => {
    const search = ctx.params.search;
    const url = `https://moly.hu/magankonyvtar?utf8=✓&order=&hide_shelf=0&hide_shelf=0&wishes=0&q=${search}&city=&average=&min_age=&max_age=&tags=&minus_tags=`
    const searchText = he.decode(search);
    
    const title = `Moly - ${searchText}`;

    ctx.state.data = await utils.getData(ctx, url, title);
};
