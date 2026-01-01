const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 1. Use the Render Environment Variable for MongoDB
// Replace 'your_database_name' with your actual DB name
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blezzy_wallet';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Use the Port Render assigns (defaulting to 3000 for local testing)
const PORT = process.env.PORT || 3000;

app.use(express.json());

// A simple route to test if the site is working
app.get('/', (req, res) => {
    res.send('<h1>Blezzy Wallet is officially Live and Connected!</h1>');
});

// Add your other routes here (e.g., app.use('/api/users', userRoutes);)

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
