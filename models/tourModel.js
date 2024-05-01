const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'The tour must have a name less than 40 characters'],
        minlength: [10, 'The tour must have a name at least 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy','medium', 'difficult'],
            message : 'Difficulty must be either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'ratings must be greater than or equal to 1'],
        max: [5, 'ratings must be less than or equal to 5'],
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){ // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Price discount must be less than price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary'],
    },
    description: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have an imageCover'],
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: String,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        }
    ],
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

tourSchema.virtual('durationInWeeks').get(function () {
    return this.duration / 7;
})

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

// MIDDLEWARE - DOCUMENT: runs before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });

    next();
})

/*tourSchema.pre('save', async function(next) {
    const guidesPromises = this.guides.map(async id => {
        const guide = await User.findById(id)
        return guide
    })
    this.guides = await Promise.all(guidesPromises);

    next();
})
*/
// MIDDLEWARE - QUERY
tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}});
    this.start = Date.now()

    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })

    next();
});
tourSchema.post(/^find/, function(docs, next){
    console.log(`${Date.now() - this.start} millseconds`);

    next();
});

// MIDDLEWARE - AGGREGATION:
tourSchema.pre('aggregate', function(next){
    this.pipeline().unshift({ $match: {secretTour: {$ne: true}}});

    next()
})

module.exports = mongoose.model('Tour', tourSchema);