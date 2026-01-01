const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// In Render, go to Environment and add MONGODB_URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blezzy_db';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Wallet Schema
const walletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 }
});
const Wallet = mongoose.model('Wallet', walletSchema);

// API Routes
app.get('/', (req, res) => res.send({ status: "Blezzy Wallet is Online" }));

app.get('/api/balance/:userId', async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.params.userId });
        if (!wallet) wallet = await Wallet.create({ userId: req.params.userId, balance: 0 });
        res.json(wallet);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/transaction', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        res.json(wallet);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
