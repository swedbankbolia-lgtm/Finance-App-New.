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
                <form action="/auth" method="POST">
                    <input type="email" name="email" placeholder="Email Address" required style="display:block; width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;">
                    <input type="password" name="password" placeholder="Passcode" required style="display:block; width:100%; padding:12px; margin-bottom:15px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;">
                    <input type="hidden" name="referredBy" value="${ref}">
                    <button type="submit" style="width:100%; padding:12px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Login / Register</button>
                </form>
                <br><a href="/forgot-password" style="font-size:12px; color:#999; text-decoration:none;">Forgot Passcode?</a>
            </div>
        </body>
    `);
});

app.post('/auth', async (req, res) => {
    const { email, password, referredBy } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email: email.toLowerCase(), password: hashed, referredBy: referredBy || null });
    } else {
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("Incorrect passcode. <a href='/'>Try again</a>");
    }
    req.session.userId = user._id;
    res.redirect('/dashboard');
});

// --- 3. THE DASHBOARD ---

app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';
    const referralLink = `${req.protocol}://${req.get('host')}/?ref=${user.email}`;

    res.send(`
        <style>
            body { font-family: sans-serif; background: #f4f7f6; margin: 0; }
            .ticker-wrap { width: 100%; overflow: hidden; background: #2c3e50; color: #fff; padding: 12px 0; border-bottom: 3px solid #f39c12; }
            .ticker { display: flex; white-space: nowrap; animation: ticker 45s linear infinite; }
            .ticker-item { padding: 0 40px; font-size: 14px; font-weight: bold; }
            @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
            .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 900px; margin: 20px auto; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .box { padding: 20px; border-radius: 8px; text-align: center; color: white; }
            .balance { background: #2ecc71; } .bonus { background: #f39c12; }
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; margin-top: 25px; }
            .partner-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #eee; height: 60px; display: flex; align-items: center; justify-content: center; }
            .partner-item img { max-height: 40px; }
        </style>
        <div class="ticker-wrap"><div class="ticker"><div class="ticker-item">AI TRADING: 20% MONTHLY YIELD</div><div class="ticker-item">ASSET RESERVES: GOLD, LITHIUM, COBALT</div></div></div>
        <div class="card">
            <div style="display:flex; justify-content:space-between;"><h2>BlezzyPay Dashboard</h2><a href="/logout">Logout</a></div>
            <div class="stats">
                <div class="box balance">Available Balance<h2>$${user.balance.toFixed(2)}</h2></div>
                <div class="box bonus">Trading Yield (20%)<h2>$${user.lockedBonus.toFixed(2)}</h2><small>Unlocks: ${dateStr}</small></div>
            </div>
            <div style="background:#eee; padding:10px; margin:10px 0;">Referral Link: <code>${referralLink}</code></div>
            <div class="partner-section" style="text-align:center;">
                <h3>Our Global Partners</h3>
                <div class="partner-grid">
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"></div>
                </div>
            </div>
        </div>
    `);
});

// --- 4. ADMIN PANEL ---

app.get('/admin-secret-panel', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Access Denied");
    const users = await User.find({});
    res.send(`
        <body style="font-family:sans-serif; background:#2c3e50; color:white; padding:40px;">
            <h1>User Registration List</h1>
            <table border="1" style="width:100%; background:white; color:black; border-collapse:collapse;">
                <tr style="background:#eee;"><th>Email</th><th>Referred By</th><th>Balance</th></tr>
                ${users.map(u => `<tr><td style="padding:10px;">${u.email}</td><td style="padding:10px;">${u.referredBy || 'Direct'}</td><td style="padding:10px;">$${u.balance}</td></tr>`).join('')}
            </table>
            <br><a href="/dashboard" style="color:white;">Dashboard</a>
        </body>
    `);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("System Online"));
});
