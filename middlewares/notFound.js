const AppError = require('../utils/appError');

const notFoundMiddleware = (req, res, next) => {
    const message = `${req.originalUrl} does not exist`
    const err = new AppError(message, 404);
    next(err)
}

module.exports = notFoundMiddleware;