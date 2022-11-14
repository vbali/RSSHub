const utils = require('./utils');
const he = require('he');

module.exports = async (ctx) => {
    const url = `http://egriugyek.hu/legrissebb-hireink`
    const title = `Egri Ügyek`;

    ctx.state.data = await utils.getData(ctx, url, title);
};
