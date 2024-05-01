const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'review must have a review'],
    },
    rating: {
        type: Number,
        default: 4.5,
        min: [1, 'ratings must be greater than or equal to 1'],
        max: [5, 'ratings must be less than or equal to 5'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.']
    }
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// MIDDLEWARE - QUERY
reviewSchema.pre(/^find/, function(next){
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
});

reviewSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}});
    this.start = Date.now()

    next();
});

reviewSchema.post(/^find/, function(docs, next){
    console.log(`${Date.now() - this.start} millseconds`);

    next();
});

module.exports = mongoose.model('Review', reviewSchema);

