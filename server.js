const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. DATABASE CONNECTION
// Updated to use 'finance_app_db' instead of blezzy
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finance_app_db';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to Finance App Database'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. MIDDLEWARE
app.use(express.json());

// 3. SMART FILE SERVING
// This tells the app to look in the root of "Finance-App-New"
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// 4. MAIN ROUTE
app.get('/', (req, res) => {
    // Aggressively looking for your index.html in the Finance-App-New structure
    const paths = [
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'public', 'index.html')
    ];

    res.sendFile(paths[0], (err) => {
        if (err) {
            res.sendFile(paths[1], (err2) => {
                if (err2) {
                    res.send('<h1>Finance App is Live!</h1><p>Check if index.html is in your Finance-App-New folder on GitHub.</p>');
                }
            });
        }
    });
});

// 5. SERVER PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Finance App running on port ${PORT}`);
});
