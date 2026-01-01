// 1. IMPORT EVERYTHING FIRST
const express = require('express');
const mongoose = require('mongoose'); // <--- THIS LINE MUST BE HERE
const path = require('path');
const app = express();

// 2. NOW DEFINE YOUR SCHEMAS
const referralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    ownerName: String,
    uses: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

const Referral = mongoose.model('Referral', referralSchema);

// 3. DATABASE CONNECTION & REST OF CODE...
const mongoURI = process.env.MONGODB_URI;
// ... (rest of your code)
