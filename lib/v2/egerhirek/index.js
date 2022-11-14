const utils = require('./utils');
const he = require('he');

module.exports = async (ctx) => {
    const url = `http://egerhirek.hu/legfrissebbek`
    const title = `Egerhírek`;

    ctx.state.data = await utils.getData(ctx, url, title);
};
