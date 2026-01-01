const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. DATABASE CONNECTION
// Uses Render environment variable or falls back to local for development
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blezzy_wallet';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. MIDDLEWARE
app.use(express.json());
// This line serves your CSS, Images, and JS from a folder named "public"
app.use(express.static(path.join(__dirname, 'public')));

// 3. ROUTES
// Serves your main HTML file when someone visits the URL
app.get('/', (req, res) => {
    // If you have an index.html in a 'public' folder:
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    
    // OR, if you don't have an HTML file yet, keep this test line:
    // res.send('<h1>Blezzy Wallet is officially Live and Connected!</h1>');
});

// 4. SERVER PORT
// Render uses process.env.PORT (usually 10000), but we allow 3000 for local testing
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
