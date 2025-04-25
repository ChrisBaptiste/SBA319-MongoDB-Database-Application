const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SavedTripSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, // References a document ID in the User collection
        ref: 'User', // Specifies the collection being referenced
        required: true // A trip must belong to a user
    },
    city: {
        type: String,
        required: [true, 'City name is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Approximate price is required'],
        min: [0, 'Price cannot be negative'] // Basic validation
    },
    lat: {
        type: Number,
        required: [true, 'Latitude is required']
    },
    lon: {
        type: Number,
        required: [true, 'Longitude is required']
    },
    imagePath: {
        type: String,
        trim: true
        
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'] 
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
});

// --- Indexes ---
//---- Testing ------
// Index to efficiently find trips saved by a specific user
const user1SavedTrips = SavedTripSchema.index({ user: 1 });
console.log(user1SavedTrips);


const SavedTrip = mongoose.model('SavedTrip', SavedTripSchema);

module.exports = SavedTrip;