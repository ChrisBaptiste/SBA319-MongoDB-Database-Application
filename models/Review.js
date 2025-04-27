const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    city: {
        type: String,
        required: [true, 'City is required for the review'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required for the review'],
        trim: true
    },
    
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be no more than 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Indexes ---
// Testing index to find reviews by a specific user
// ReviewSchema.index({ user: 1 });

// Testing index to find reviews for a specific location 
// ReviewSchema.index({ city: 1, country: 1 });


const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;