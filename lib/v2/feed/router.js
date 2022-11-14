module.exports = (router) => {
    router.get('/:https/:domain(.*)', lazyloadRouteHandler('./feed'));
};
