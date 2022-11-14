module.exports = (router) => {
    router.get('/:category?/:search', require('./search'));
};
