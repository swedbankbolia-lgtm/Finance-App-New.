const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. DATABASE CONNECTION
// We FORCE the use of the environment variable. 
// If it's missing, the app will tell us clearly in the logs.
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("❌ ERROR: MONGODB_URI is not defined in Render Environment Variables!");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connected to MongoDB Atlas'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// 2. MIDDLEWARE & STATIC FILES
app.use(express.json());
app.use(express.static(__dirname));

// 3. ROUTES
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            res.send("<h1>Finance App Live</h1><p>Database status: Check Logs.</p>");
        }
    });
});

// 4. PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
