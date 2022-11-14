module.exports = (router) => {
    router.get('/:categoryId/:search', require('./search'));
};
