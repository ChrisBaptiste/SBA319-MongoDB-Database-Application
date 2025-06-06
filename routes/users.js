// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');



// ------------------ Routes ----------------------

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
     // Destructure request body
    const { username, email, password } = req.body;

    // Basic Validation (Checking if fields are provided)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // Explicit Password Length Validation (Checking original password before hashing)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Checking if user already exists (by email or username)
        // We use User.findOne() with $or to efficiently check if either the email or username is already taken
        let existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) {
            let message = existingUser.email === email ? 'Email already in use' : 'Username already taken';
            return res.status(400).json({ message: message });
        }

        // Creating a new User instance
        const newUser = new User({
            username,
            email,
            password // Plain password stored temporarily in the object, hash next
        });

        // Hashing the password
        // We use bcrypt to securely hash the password before saving it to the database
        const salt = await bcrypt.genSalt(10); // Generated 10 rounds of salt to make common passwords more secured afainst hacking
        newUser.password = await bcrypt.hash(password, salt); // Replace plain password with the hash

        // Saving the user to the database
        // The .save() method attempts to store the document in MongoDB
        // It also triggers Mongoose schema validations (required, unique, format, etc.) on the final data 

        // Sending success response without sending back the user's password hash
        const userResponse = {
             _id: newUser._id,
             username: newUser.username,
             email: newUser.email,
             createdAt: newUser.createdAt
        };
        res.status(201).json({ message: 'User registered successfully', user: userResponse });

    } catch (err) {
        // Handling potential errors during the process
        // checking for Mongoose validation errors like unique constraint fail, invalid email format etc.
        if (err.name === 'ValidationError') {
            // Extracting meaningful messages from the Mongoose validation error object
             let errors = {};
             Object.keys(err.errors).forEach((key) => {
                 errors[key] = err.errors[key].message;
             });
             return res.status(400).json({ message: 'Validation Error', errors: errors });
        }
        // Handling other potential server errors (e.g., database connection issues)
        console.error("Registration Error:", err.message); // Log the detailed error on the server
        res.status(500).json({ message: 'Server error during registration' }); // Send generic error to client
    }
});

// POST /api/users/login - Log in a user 
router.post('/login', async (req, res) => {
    // Destructure request body (allowing login via email or username)
    const { email, username, password } = req.body;

    // Checking if identifier and password are provided
    const identifier = email || username; // Use email if provided, otherwise username
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    try {
        // Finding user by email or username
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        // Checking if user exists
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        //  Compare provided password with stored hash
        // bcrypt.compare handles extracting the salt from the stored hash automatically
        const isMatch = await bcrypt.compare(password, user.password);

        // Checking if passwords match
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Login Successful!
        // sending back success message and user info (excluding password)
         const userResponse = {
             _id: user._id,
             username: user.username,
             email: user.email,
             createdAt: user.createdAt
         };

        res.status(200).json({
            message: 'Login successful',
            user: userResponse
        });

    } catch (err) {
        // Handling potential server errors
        console.error("Login Error:", err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});


// GET /api/users - route to get all users 
router.get('/', async (req, res) => {
     try {
            // Fetching users but excluding the password field from the result
            const users = await User.find().select('-password');
            res.json(users);
        } catch (err) {
            console.error("Error fetching users:", err.message);
            res.status(500).send('Server Error');
        }
});

// --- Export Router ---
// Making the router available for use in server.js
module.exports = router;