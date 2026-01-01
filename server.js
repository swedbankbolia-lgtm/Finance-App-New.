// 1. IMPORT NECESSARY MODULES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. MIDDLEWARE
// Allows your frontend to talk to your backend and parses JSON data
app.use(cors());
app.use(express.json());

// 3. DATABASE CONNECTION
// On Render, add your MongoDB string to Environment Variables as MONGODB_URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blezzy_db';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 4. DATABASE MODEL (Wallet Schema)
const walletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastTransaction: { type: Date, default: Date.now }
});

const Wallet = mongoose.model('Wallet', walletSchema);

// 5. API ROUTES (The Logic)

// Home Route (Health Check)
app.get('/', (req, res) => {
    res.send({ status: "Online", message: "Blezzy Wallet API is running." });
});

// GET BALANCE: e.g., /api/balance/user123
app.get('/api/balance/:userId', async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.params.userId });
        if (!wallet) {
            // If user doesn't exist yet, create a wallet with 0 balance
            wallet = await Wallet.create({ userId: req.params.userId, balance: 0 });
        }
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch balance" });
    }
});

// ADD/SUBTRACT FUNDS: Expects { "userId": "user123", "amount": 50 }
app.post('/api/transaction', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount }, lastTransaction: Date.now() },
            { new: true, upsert: true } // Creates wallet if it doesn't exist
        );
        res.json({ message: "Transaction successful", balance: wallet.balance });
    } catch (error) {
        res.status(500).json({ error: "Transaction failed" });
    }
});

// 6. START THE SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});
