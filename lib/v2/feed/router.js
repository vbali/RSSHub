module.exports = (router) => {
    router.get('/:https/:domain(.*)', require('./feed'));
};
