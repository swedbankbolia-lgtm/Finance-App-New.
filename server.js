const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. MIDDLEWARE (Crucial for reading JSON from your buttons)
app.use(express.json());
app.use(express.static(__dirname));

// 2. DATABASE CONNECTION
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("❌ ERROR: MONGODB_URI is missing in Render Environment Variables!");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connected to MongoDB Atlas'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// 3. SCHEMAS
const referralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    ownerName: String,
    uses: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

// Check if model exists to prevent "OverwriteModelError"
const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

// 4. ROUTES
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Referral Verification Route
app.post('/api/verify-referral', async (req, res) => {
    try {
        const { code } = req.body;
        const validCode = await Referral.findOne({ code: code, active: true });
        if (validCode) {
            validCode.uses += 1;
            await validCode.save();
            res.json({ success: true, message: "Access Granted" });
        } else {
            res.json({ success: false, message: "Invalid or Expired Code" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Database Error" });
    }
});

// Admin Route
app.post('/api/admin/generate-code', async (req, res) => {
    const { adminKey, newCode, partnerName } = req.body;
    if (adminKey !== "BlezzyAdmin2026!") return res.status(403).send("Denied");

    try {
        const referral = new Referral({ code: newCode, ownerName: partnerName });
        await referral.save();
        res.json({ success: true, message: "Code Created!" });
    } catch (err) {
        res.json({ success: false, message: "Error creating code" });
    }
});

// 5. SERVER START (This prevents 'Exited Early')
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Blezzy Finance Server is LIVE on port ${PORT}`);
});
