// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');




// --- Routes ---

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
     //Destructure request body
    const { username, email, password } = req.body;

    // Basic Validation (Checking if fields are provided)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    try {
        // Checking if user already exists (by email or username)
        //We use User.findOne() with $or to efficiently check if either the email or username is already taken
        let existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) {
            let message = existingUser.email === email ? 'Email already in use' : 'Username already taken';
            return res.status(400).json({ message: message });
        }

        // Creatinga a new User instance 
        const newUser = new User({
            username,
            email,
            password // Plain password for now, hash next
        });

        //  Hash the password
        const salt = await bcrypt.genSalt(10); // Generate salt (10 rounds is standard)
        newUser.password = await bcrypt.hash(password, salt); // Hash password and store it

        //  Saving the user to the database
        await newUser.save(); // Mongoose .save() triggers validation & saving

        // Sending success response without sending back the user's password
        const userResponse = {
             _id: newUser._id,
             username: newUser.username,
             email: newUser.email,
             createdAt: newUser.createdAt
        };
        res.status(201).json({ message: 'User registered successfully', user: userResponse });

    } catch (err) {
        // Handling potential errors and Mongoose validation errors
        if (err.name === 'ValidationError') {
            // Extracting meaningful messages from Mongoose validation error
             let errors = {};
             Object.keys(err.errors).forEach((key) => {
                 errors[key] = err.errors[key].message;
             });
             return res.status(400).json({ message: 'Validation Error', errors: errors });
        }
        // Handling other potential errors and database connection issues
        console.error("Registration Error:", err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// POST /api/users/login - Log in a user (Implementation next)
router.post('/login', async (req, res) => {
    res.send('User login endpoint'); // Placeholder
});

// GET /api/users -  for admin later, needs authentication
router.get('/', async (req, res) => {
     try {
            const users = await User.find().select('-password'); // Exclude passwords
            res.json(users);
        } catch (err) {
            console.error("Error fetching users:", err.message);
            res.status(500).send('Server Error');
        }
});

// --- Export Router ---
module.exports = router;