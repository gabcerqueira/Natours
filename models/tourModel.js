const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [5, 'The name is too short'],
      maxlength: [50, 'The name is too long'],
      validate: {
        validator: function (val) {
          return validator.isAlpha(val, ['en-US'], { ignore: ' ' });
        },
        message: 'The name must only contain characters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      trim: true,
      enum: {
        values: ['easy', 'medium', 'difficulty'],
        message: 'Only easy medium or difficult is accepted',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be between 1 and 5'],
      max: [5, 'A rating must be between 1 and 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: `The discount of {VALUE} should be below regular price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE : RUNS BEFORE .SAVE() AND .CREATE()
// \/ pre save hook é o nome da middleware

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
/*
tourSchema.pre('save', function (next) {
  console.log('Will save the doc');
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log('Mongo doc : ', doc);
  next();
});
*/

// QUERY MIDDLEWARE
tourSchema.pre(/^find /, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.post(/^find /, function (docs, next) {
  console.log('Query docs : ', docs);
  next();
});

//Aggregation Middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
