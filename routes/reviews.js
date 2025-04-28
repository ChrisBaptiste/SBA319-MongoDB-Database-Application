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

// PATCH /api/reviews/:id - Update a review
// IMPORTANT: route needs ownership check in the real app version to authorize changes for reviews!
router.patch('/:id', async (req, res) => {
    const { id } = req.params; // Get review ID from URL
    const updates = req.body; // Get fields to update like rating and comments

    // Validating ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Review ID format.' });
    }

    //  only allow updating ratings and comments
    const allowedUpdates = ['rating', 'comment'];
    const requestedUpdates = Object.keys(updates);
    const isValidOperation = requestedUpdates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
         const invalidFields = requestedUpdates.filter(update => !allowedUpdates.includes(update));
         return res.status(400).json({ error: `Invalid updates attempted! Only the following fields can be updated: ${allowedUpdates.join(', ')}. Cannot update: ${invalidFields.join(', ')}` });
    }
   

    // Validate ratings if it's being updated
    if (updates.rating !== undefined && (typeof updates.rating !== 'number' || updates.rating < 1 || updates.rating > 5)) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }


    try {
        // Finding the review by ID
        // We need to find it first to potentially check ownership later
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        //  Account OWNERSHIP CHECK 
         const loggedInUserId = req.user.id;
        if (review.user.toString() !== loggedInUserId) {
            return res.status(403).json({ message: 'User not authorized to update this review.' });
         }


        // Applying updates and save 
        Object.keys(updates).forEach(updateKey => {
            review[updateKey] = updates[updateKey];
        });
        const updatedReview = await review.save(); 

        // Populating user info again after update
        const finalReview = await Review.findById(updatedReview._id).populate('user', 'username _id');


        res.status(200).json(finalReview); // Sending back the updated review

    } catch (err) {
        // Handling potential errors like Validation and DB connection.
         if (err.name === 'ValidationError') {
             let errors = {};
             Object.keys(err.errors).forEach((key) => {
                 errors[key] = err.errors[key].message;
             });
             return res.status(400).json({ message: 'Validation Error updating review', errors: errors });
         }
        console.error("Error updating review:", err.message);
        res.status(500).json({ message: 'Server error while updating review.' });
    }
});


// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req, res) => {
    const { id } = req.params; // Getting review ID from URL

    // Validating ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Review ID format.' });
    }

    try {
        // Finding the review first to check user's account ownership before deleting it.
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // checking first if account belongs to user before authorazing the deletion of a review.
        // const loggedInUserId = req.user.id; 
        // if (review.user.toString() !== loggedInUserId) {
        //     return res.status(403).json({ message: 'User not authorized to delete this review.' });
        // }

        // deleting the review
        await Review.findByIdAndDelete(id);

        res.status(200).json({ message: 'Review deleted successfully.' }); // Send success message

    } catch (err) {
        console.error("Error deleting review:", err.message);
        res.status(500).json({ message: 'Server error while deleting review.' });
    }
});



// --- Export Router ---
module.exports = router;