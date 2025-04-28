// server/routes/savedTrips.js
const express = require('express');
const router = express.Router();
const SavedTrip = require('../models/SavedTrip.js');
const User = require('../models/User.js'); // Requires to verify if user exists
const mongoose = require('mongoose'); // Required for validating ObjectId



// ------------------ Routes --------------------------

// POST /api/savedtrips - Save a new trip for a user
router.post('/', async (req, res) => {
    // Destructuring trip details AND the userId from request body
    //For now, we'll require the userId to be passed in the request body to implement CRUD Logic. 
    const { userId, city, country, price, lat, lon, imagePath, notes } = req.body;

    // Basic Validation to check required fields
    if (!userId || !city || !country || price === undefined || lat === undefined || lon === undefined) {
        return res.status(400).json({ message: 'Missing required fields: userId, city, country, price, lat, lon are required.' });
    }

    // Validating if userId is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        // Checking if the user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Creating a new SavedTrip document
        const newSavedTrip = new SavedTrip({
            user: userId, // Linking the trip to the user
            city,
            country,
            price,
            lat,
            lon,
            imagePath, // Okay if undefined/null
            notes      // Okay if undefined/null
        });

        // Saving the trip to the database (triggers Mongoose validation)
        const savedTrip = await newSavedTrip.save();

        // Sending success response with the saved trip data
        res.status(201).json(savedTrip);

    } catch (err) {
        // Handling potential errors (Mongoose validation and DB connection)
        if (err.name === 'ValidationError') {
            let errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });
            return res.status(400).json({ message: 'Error saving trip', errors: errors });
        }
        console.error("Error saving trip:", err.message);
        res.status(500).json({ message: 'Server error while saving trip.' });
    }
});

//  GET /api/savedtrips - Get all trips saved by a specific user
router.get('/', async (req, res) => {
    const { userId } = req.query; // Get userId from query string

    // Checking if userId was provided
    if (!userId) {
        return res.status(400).json({ message: 'User ID query parameter is required.' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        // Finding all trips where the user field matches the provided userId
        const trips = await SavedTrip.find({ user: userId })
            .sort({ savedAt: -1 }); //  Sorting by newest first

        // Sending the found trips (will be an empty array if none found)
        res.status(200).json(trips);

    } catch (err) {
        // Handling potential errors
        console.error("Error fetching saved trips:", err.message);
        res.status(500).json({ message: 'Server error while fetching saved trips.' });
    }
});


//  GET /api/savedtrips/:id - Get a specific saved trip by its ID
router.get('/:id', async (req, res) => {
    const { id } = req.params; // Get trip ID from URL parameters

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Trip ID format.' });
    }

    try {
        const trip = await SavedTrip.findById(id); // Finding trips by its unique _id

        // Checking if trip exists
        if (!trip) {
            return res.status(404).json({ message: 'Saved trip not found.' });
        }
        res.status(200).json(trip);

    } catch (err) {
        console.error("Error fetching single saved trip:", err.message);
        res.status(500).json({ message: 'error while fetching trip.' });
    }
});


// PATCH /api/savedtrips/:id - Update a specific saved trip 
router.patch('/:id', async (req, res) => {
    const { id } = req.params; // Get trip ID from URL parameters
    const updates = req.body; // Get the fields to update from the request body

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Trip ID format.' });
    }

    // Prevent updating certain fields (like user, id, savedAt)
    const allowedUpdates = ['notes', 'imagePath', 'price']; //  only allow these to be patched
    const requestedUpdates = Object.keys(updates);
    const isValidOperation = requestedUpdates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        // Find which fields are not allowed
        const invalidFields = requestedUpdates.filter(update => !allowedUpdates.includes(update));
        return res.status(400).json({ error: `Invalid updates attempted! Cannot update fields: ${invalidFields.join(', ')}` });
    }

    try {
        //  ensuring Mongoose schema validations run on update
        const updatedTrip = await SavedTrip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        // Checking if trip exists
        if (!updatedTrip) {
            return res.status(404).json({ message: 'Saved trip not found.' });
        }

        res.status(200).json(updatedTrip); // Send back the updated trip

    } catch (err) {
        // Handling potential errors like Validation and DB connection
        if (err.name === 'ValidationError') {
            let errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });
            return res.status(400).json({ message: 'Validation Error updating trip', errors: errors });
        }
        console.error("Error updating saved trip:", err.message);
        res.status(500).json({ message: 'Server error while updating trip.' });
    }
});

// // DELETE /api/savedtrips/:id - Delete a specific saved trip
// router.delete('/:id', async (req, res) => {
//     // Delete logic here
//     res.status(501).send('DELETE /api/savedtrips/:id not implemented yet'); // 501 Not Implemented
// });


// --- Export Router ---
module.exports = router;