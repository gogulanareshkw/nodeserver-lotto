const jwt = require("jsonwebtoken");
const User = require('../models/user');
var constants = require('../config/constants');
const config = require('../../config');

module.exports = async function (req, res, next) {
    //get the token from the header if present
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    //if no token found, return response (without going to the next middelware)
    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
        //if can verify the token, set req.user and pass to next middleware
        const bearer = token.split(' ');
        const validtoken = bearer[1];
        const decoded = jwt.verify(validtoken, config.jwtSecret);
        var user = await User.findById(decoded._id);
        if (Boolean(user)) {
            if (user.blockedByAdmin) {
                return res.status(400).json({ success: false, message: "Your account is blocked by Admin." });
            }
            if (user.userRole !== constants.USER_ROLE_USER) {
                req.user = decoded;
                next();
            }
            else {
                return res.status(400).json({ success: false, message: "No User can access." })
            }
        }
        else {
            return res.status(400).json({ success: false, message: "User doesn't exist." })
        }
    } catch (ex) {
        //if invalid token
        config.logger.error({ ex }, 'Error in nonUserAuth');
        return res.status(401).send("Token expired");
    }
};