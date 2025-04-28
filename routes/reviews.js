// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review.js');
const User = require('../models/User.js');
const mongoose = require('mongoose');




// ----------------- Routes ---------------

// POST /api/reviews - Create a new review
router.post('/', async (req, res) => {
    // Destructure required fields from request body
    // temporarily using userId until proper authentication is added later
    const { userId, city, country, rating, comment } = req.body;

    // Basic Validation to check required fields.
    if (!userId || !city || !country || rating === undefined) {
        return res.status(400).json({ message: 'Missing required fields: userId, city, country, rating are required.' });
    }

    // Validating userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // Validating rating range 
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }

    try {
        // Checking if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Creating a new Review document
        const newReview = new Review({
            user: userId,
            city,
            country,
            rating,
            comment
        });

        // Save the review to trigger Mongoose validation
        const savedReview = await newReview.save();

        // Populating user info before sending response 
        // Selecting only username and id to avoid sending sensitive info.
        const reviewWithOwner = await Review.findById(savedReview._id).populate('user', 'username _id');

        res.status(201).json(reviewWithOwner); // Sending back the created review with user info

    } catch (err) {
        // Handling potential errors like Mongoose validation and DB connection.
        if (err.name === 'ValidationError') {
            let errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });
            return res.status(400).json({ message: 'Validation Error saving review', errors: errors });
        }
        console.error("Error saving review:", err.message);
        res.status(500).json({ message: 'Server error while saving review.' });
    }
});

// GET /api/reviews - Get reviews, filtered by location (city/country)
router.get('/', async (req, res) => {
    const { city, country, userId } = req.query; // Allows filtering by city/country or userId

    // Building the filter object dynamically based on query parameters
    let filter = {};
    if (city) {
        // Case-insensitive search using regex
        filter.city = new RegExp(`^${city}$`, 'i'); // Exact match but case-insensitive
    }
    if (country) {
        filter.country = new RegExp(`^${country}$`, 'i'); // Exact match but case-insensitive
    }
    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format provided for filtering.' });
        }
        filter.user = userId;
    }

    // Checking if at least one valid filter criteria was provided
    if (Object.keys(filter).length === 0) {
        // Return error - force client to provide filter
        return res.status(400).json({ message: 'Please provide filter criteria (e.g., city and country, or userId).' });
    }


    try {
        // Finding reviews matching the filter
        // Populating the 'user' field, selecting only 'username' and 'id'
        const reviews = await Review.find(filter)
            .populate('user', 'username _id') // Get associated user's username
            .sort({ createdAt: -1 }); // Sorting by newest reviews first

        res.status(200).json(reviews); // Sending the found reviews

    } catch (err) {
        console.error("Error fetching reviews:", err.message);
        res.status(500).json({ message: 'Server error while fetching reviews.' });
    }
});


// GET /api/reviews/:id - Get a single review by its ID
router.get('/:id', async (req, res) => {
    const { id } = req.params; // Getting review ID from URL

    // Validating ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Review ID format.' });
    }

    try {
        // Finding review by ID to populate user info
        const review = await Review.findById(id).populate('user', 'username _id');

        // Checking if review exists
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        res.status(200).json(review); // Send the found review

    } catch (err) {
        console.error("Error fetching single review:", err.message);
        res.status(500).json({ message: 'Server error while fetching review.' });
    }
});
// --- Export Router ---
module.exports = router;