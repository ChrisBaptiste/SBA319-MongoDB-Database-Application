
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); 
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;


//using ejs to handle basic front end for viewing and rendering static files.
// --- View Engine Setup ---
app.set('view engine', 'ejs'); // Set EJS as the templating engine
// Telling Express where to find the views directory.
app.set('views', path.join(__dirname, '../views'));


// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files (CSS, Client-Side JS, Images) 
app.use(express.static(path.join(__dirname, '../'))); // Serve files from the root directory


 // passing data from the server to the back end.
// app.get('/', (req, res) => {
//     res.send('Hello from Budget Backpacker Backend API!');
// });


// Rendering EJS view (index.ejs) from the root '/' route
 // passing data from the server to the view in the front end.
app.get('/', (req, res) => {
    res.render('index', { title: 'Budget Backpacker Planner' }); // Renders views/index.ejs
});


// --- TODO: API Routes ---
app.use('/api/users', require('./routes/users'));
app.use('/api/savedtrips', require('./routes/savedTrips.js'));
app.use('/api/reviews', require('./routes/reviews.js'));
// ... other API routes ...


// --- Database Connection & Server Start ---
const connectDB = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI string is not working properly in .env file');
        }
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected Successfully');

        app.listen(PORT, () => {
            console.log(`Server listening on port http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};

connectDB();

mongoose.connection.on('error', err => {
    console.error(`Mongoose connection error: ${err}`);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});