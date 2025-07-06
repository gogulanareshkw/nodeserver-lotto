/**
 * Enhanced Body Parser Middleware
 * Safely handles req.body destructuring and provides fallbacks
 */

const bodyParserMiddleware = (req, res, next) => {
  // Ensure req.body exists
  if (!req.body) {
    req.body = {};
  }

  // Add safe destructuring helper
  req.safeBody = (defaultValue = {}) => {
    return req.body || defaultValue;
  };

  // Add safe property extraction
  req.getBodyProperty = (property, defaultValue = null) => {
    return req.body && req.body[property] !== undefined ? req.body[property] : defaultValue;
  };

  // Add safe destructuring with defaults
  req.destructureBody = (properties, defaults = {}) => {
    const result = {};
    properties.forEach(prop => {
      result[prop] = req.getBodyProperty(prop, defaults[prop]);
    });
    return result;
  };

  next();
};

module.exports = bodyParserMiddleware; 