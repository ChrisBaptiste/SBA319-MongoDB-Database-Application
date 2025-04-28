// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Reviews.js'); 
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



// --- Export Router ---
module.exports = router;