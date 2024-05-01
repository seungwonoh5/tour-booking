const AppError = require('../utils/appError');

// Expected Operational Errors which we want to display user-friendly messages
const handleCastErrorDB = (err) => {
    // casterror in route: /:id 
    console.log(err.path)
    const message = `Invalid ${err.path}: ${err.value}`;

    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = (err) => {
    const duplicateValue = Object.values(err.keyValue);
    const message = `Duplicate field value entered: ${duplicateValue}`;
    
    return new AppError(message, 400);
}

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message); 
    const message = `Invalid Input Data. ${errors.join('. ')}`;
    
    return new AppError(message, 400);
}

const handleJWTError = () => {
    const message = 'Invalid Token. Please try again.';
    
    return new AppError(message, 401);
}

const handleTokenExpiredError = () => {
    const message = 'Token Expired. Please log in again.';
    
    return new AppError(message, 401);
}

const sendErrorDev = (err, req, res) => {
    res.status(err.statusCode).json({
        error: err,
        status: err.status,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err, req, res) => {
    // Operational, trusted error = send message to client
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    // Programming or other unknown error, send generic message
    } else {
        // console.error('ERROR ', err) // Log Error

        res.status(err.statusCode).json({
            status: 'error',
            message: 'Something went wrong.'
        })
    }
}

const globalMiddleware = (err, req, res, next) => {
    // err = errors in json
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    console.log(err.name)
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    }
    else if (process.env.NODE_ENV === 'production') {        
        if(err.code === 11000) err = handleDuplicateFieldsDB(err)
        if(err.name === 'CastError') err = handleCastErrorDB(err)
        if(err.name === 'ValidationError') err = handleValidationErrorDB(err)
        if(err.name === 'JsonWebTokenError') err = handleJWTError()
        if(err.name === 'TokenExpiredError') err = handleTokenExpiredError()

        sendErrorProd(err, req, res)  
    }

    next()
}

module.exports = globalMiddleware;