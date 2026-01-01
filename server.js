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

// 3. SMART FILE SERVING
// This tells Express to look for your HTML/CSS files in 'public' first, then the root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// 4. MAIN ROUTE
app.get('/', (req, res) => {
    // This looks for index.html in /public, and falls back to / if not found
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');

    res.sendFile(indexPath, (err) => {
        if (err) {
            // If not in public, try the root directory
            res.sendFile(rootPath, (rootErr) => {
                if (rootErr) {
                    // If no file exists at all, show this success message
                    res.status(200).send('<h1>Blezzy Wallet is Live!</h1><p>Note: index.html was not found, but your server is working.</p>');
                }
            });
        }
    });
});

// 5. SERVER PORT
// Render uses process.env.PORT, but we allow 3000 for local testing
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
