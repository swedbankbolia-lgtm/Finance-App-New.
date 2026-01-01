const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'blezzy_pay_2026_secure', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 1. DATABASE SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBonus: { type: Number, default: 0 },
    bonusReleaseDate: { type: Date },
    resetRequested: { type: Boolean, default: false },
    referredBy: { type: String, default: null },
    pendingDeposits: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    pendingWithdrawals: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    transactions: [{ type: { type: String }, amount: Number, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);

// --- 2. AUTHENTICATION (LOGIN & REGISTRATION) ---

app.get('/', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`
        <body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5; margin:0;">
            <div style="background:white; padding:40px; border-radius:15px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:350px; text-align:center;">
                <h2 style="color:#2c3e50;">BlezzyPay Access</h2>
                <p style="font-size:12px; color:#666; margin-bottom:20px;">Enter details to Login or Create Account</p>
                <form action="/auth" method="POST" autocomplete="off">
                    <input type="email" name="email" placeholder="Email Address" required style="display:block; width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;">
                    <input type="password" name="password" placeholder="Passcode" required style="display:block; width:100%; padding:12px; margin-bottom:15px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;">
                    <input type="hidden" name="referredBy" value="${ref}">
                    <button type="submit" style="width:100%; padding:12px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Enter Dashboard</button>
                </form>
                <br><a href="/forgot-password" style="font-size:12px; color:#999; text-decoration:none;">Forgot Passcode?</a>
            </div>
        </body>
    `);
});

app.post('/auth', async (req, res) => {
    const { email, password, referredBy } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
        // REGISTRATION: Create new user if they don't exist
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashed, referredBy: referredBy || null });
        req.session.userId = user._id;
        return res.redirect('/dashboard');
    } else {
        // LOGIN: Verify password for existing user
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user._id;
            return res.redirect('/dashboard');
        } else {
            return res.send("<body style='text-align:center; padding-top:50px;'><h3>Incorrect Passcode for this email.</h3><a href='/'>Try Again</a></body>");
        }
    }
});

// --- 3. ADMIN PANEL (TO SEE ALL REGISTRATIONS) ---

app.get('/admin-secret-panel', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Access Denied");
    const users = await User.find({});
    
    res.send(`
        <body style="font-family:sans-serif; background:#2c3e50; color:white; padding:40px;">
            <div style="max-width:1000px; margin:auto;">
                <h1>Master Admin Control</h1>
                <p>Total Registered Users: <strong>${users.length}</strong></p>
                <table border="1" style="width:100%; background:white; color:black; border-collapse:collapse;">
                    <tr style="background:#eee;">
                        <th style="padding:10px;">User Email</th>
                        <th style="padding:10px;">Referred By</th>
                        <th style="padding:10px;">Balance</th>
                        <th style="padding:10px;">Actions</th>
                    </tr>
                    ${users.map(u => `
                        <tr>
                            <td style="padding:10px;">${u.email}</td>
                            <td style="padding:10px;">${u.referredBy || 'Direct'}</td>
                            <td style="padding:10px;">$${u.balance.toFixed(2)}</td>
                            <td style="padding:10px;">
                                ${u.resetRequested ? '<b style="color:red;">RESET REQ</b>' : 'Active'}
                            </td>
                        </tr>
                    `).join('')}
                </table>
                <br><a href="/dashboard" style="color:white; font-weight:bold;">Return to My Dashboard</a>
            </div>
        </body>
    `);
});

// --- (Keep all other routes like /dashboard, /deposit, /logout exactly the same) ---
// [Add the rest of the previously provided code here for dashboard, etc.]

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("System Online"));
});
