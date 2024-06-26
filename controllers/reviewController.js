const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }

    const reviews = await Review.find(filter)
    
    res.status(200).json({
        status:'success',
        results: reviews.length,
        data: {
            reviews
        }
    }) 
})

exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    
    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    })
})

exports.getReview = catchAsync(async (req, res, next) => {
    const tour = await Review.findById(req.params.id)
    //const tour = await Tour.findOne({ _id: req.params.id})
    if(!tour){
        return next(new AppError('No tour found with that ID', 404))
    }
    res.status(200).json({
        status:'success',
        data: {
            tour
        }
    })
})

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    if(!tour){
        return next(new AppError('No tour found with that ID', 404))
    }

    res.status(200).json({
        status:'success',
        data: {
            tour
        }
    })
})

exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)