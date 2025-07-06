const config = require('../../config');

module.exports = function (req, res, next) {
    const { appkey } = req.query;
    //if provided App Key is not valid, return response (without going to the next middelware)
    if (appkey !== config.SECURE_APP_KEY) return res.status(401).send("Access denied. Can't process your request.");
    next();
};