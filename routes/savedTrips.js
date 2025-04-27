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

// // GET /api/savedtrips - Get all trips saved by a specific user
// router.get('/', async (req, res) => {
//     // Read (all for user) logic here
//      res.status(501).send('GET /api/savedtrips?userId=... not implemented yet'); 
// });

// // GET /api/savedtrips/:id - Get a specific saved trip by its ID
// router.get('/:id', async (req, res) => {
//     // Read (one) logic here
//     res.status(501).send('GET /api/savedtrips/:id not implemented yet'); // 501 Not Implemented
// });

// // PATCH /api/savedtrips/:id - Update a specific saved trip (e.g., add notes)
// router.patch('/:id', async (req, res) => {
//     // Update logic here
//     res.status(501).send('PATCH /api/savedtrips/:id not implemented yet'); // 501 Not Implemented
// });

// // DELETE /api/savedtrips/:id - Delete a specific saved trip
// router.delete('/:id', async (req, res) => {
//     // Delete logic here
//     res.status(501).send('DELETE /api/savedtrips/:id not implemented yet'); // 501 Not Implemented
// });


// --- Export Router ---
module.exports = router;