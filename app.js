const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongooseSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const reviewRouter = require('./routes/reviewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const errorHandlerMiddleware = require('./middlewares/errorHandler')
const notFoundMiddleware = require('./middlewares/notFound')

const app = express();

// 1) MIDDLEWARE
app.use(morgan('dev'));

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again later'
})
app.use('/api', limiter);

app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data Sanitzation against NoSQL injection attacks
app.use(mongooseSanitize());

// Data Sanitzation against XSS attacks
app.use(xss());

// Data Sanitzation against XSS attacks
app.use(
    hpp({
        whitelist: [
            'duration', 
            'ratingsQuantity', 
            'ratingsAverage', 
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

// Serving static files from public folder
app.use(express.static('./public'));

// Test middleware -
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.headers);
    next();
});

// 2) MIDDLEWARE - ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// 3) MIDDLEWARE - ERROR HANDLER
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware)

module.exports = app;
