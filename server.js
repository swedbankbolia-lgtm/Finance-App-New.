// 1. Define the Referral Schema
const referralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    ownerName: String,
    uses: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

const Referral = mongoose.model('Referral', referralSchema);

// 2. Create the API Route to check codes
app.post('/api/verify-referral', async (req, res) => {
    const { code } = req.body;
    try {
        const validCode = await Referral.findOne({ code: code, active: true });
        if (validCode) {
            // Increase use count
            validCode.uses += 1;
            await validCode.save();
            res.json({ success: true, message: "Access Granted" });
        } else {
            res.json({ success: false, message: "Invalid or Expired Code" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
});
