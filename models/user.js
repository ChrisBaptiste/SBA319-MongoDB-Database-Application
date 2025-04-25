const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // User name must be unique
        trim: true, // Removes whitespace from both ends
        minlength: [6, 'Username must be at least 6 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true, // Converts email to lowercase before saving
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Basic email format validation
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the date when a user is created
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;