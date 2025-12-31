const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer'); // Added for email alerts
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'finance_secret', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 1. EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL_USER, // Your Gmail
        pass: process.env.ADMIN_EMAIL_PASS  // Your Gmail App Password
    }
});

const sendAlert = (subject, text) => {
    const mailOptions = {
        from: process.env.ADMIN_EMAIL_USER,
        to: 'emmanuel.iyere84@gmail.com', // Your receiving email
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("Email Error: " + error);
    });
};

// --- 2. DATABASE SCHEMA ---
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

// --- 3. DASHBOARD & UI ---
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';
    const referralLink = `${req.protocol}://${req.get('host')}/?ref=${user.email}`;
    const waMessage = encodeURIComponent("Welcome to BlezzyPay! AI trading guarantees 20% return. We trade Gold, Lithium, Cobalt, and Crypto.");

    res.send(`
        <head><title>BlezzyPay Dashboard</title></head>
        <style>
            body { font-family: sans-serif; background: #f4f7f6; margin: 0; color: #333; }
            .ticker-wrap { width: 100%; overflow: hidden; background: #2c3e50; color: #fff; padding: 12px 0; border-bottom: 3px solid #f39c12; }
            .ticker { display: flex; white-space: nowrap; animation: ticker 45s linear infinite; }
            .ticker-item { padding: 0 40px; font-size: 14px; font-weight: bold; }
            @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
            .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 900px; margin: 20px auto; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .box { padding: 20px; border-radius: 8px; text-align: center; color: white; }
            .balance-box { background: #2ecc71; }
            .bonus-box { background: #f39c12; }
            .section { margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
            .btn { padding: 12px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 20px; margin-top: 25px; }
            .partner-item { background: white; padding: 10px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; height: 75px; border: 1px solid #eee; }
            .partner-item img { max-height: 50px; max-width: 110px; }
            .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25d366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; }
        </style>

        <div class="ticker-wrap">
            <div class="ticker">
                <div class="ticker-item">ROADMAP: <span style="color:#f1c40f;">Gold-Backed Token in 12 Months!</span></div>
                <div class="ticker-item">AI ASSETS: <span style="color:#f1c40f;">Gold, Lithium, Cobalt</span></div>
                <div class="ticker-item">YIELD: <span style="color:#2ecc71;">20% Guaranteed</span></div>
            </div>
        </div>

        <div class="card">
            <h2>Dashboard</h2>
            <div class="stats-grid">
                <div class="box balance-box">Available Balance<h1>$${user.balance.toFixed(2)}</h1></div>
                <div class="box bonus-box">AI Trade Yield (20%)<h1>$${user.lockedBonus.toFixed(2)}</h1><small>Unlocks: ${dateStr}</small></div>
            </div>
            
            <div class="section">
                <h3>Finance Actions</h3>
                <form action="/deposit" method="POST"><input type="number" name="amount" placeholder="Deposit Amount" required style="width:100%; padding:10px; margin-bottom:5px;"><button type="submit" class="btn" style="background:#27ae60;">Deposit</button></form>
                <form action="/withdraw" method="POST"><input type="number" name="amount" placeholder="Withdraw Amount" required style="width:100%; padding:10px; margin-bottom:5px;"><button type="submit" class="btn" style="background:#e67e22;">Withdraw</button></form>
            </div>

            <div class="section">
                <h3>Affiliate Link</h3><code style="background:#eee; padding:10px; display:block;">${referralLink}</code>
            </div>

            <div class="section">
                <h3>Update Passcode</h3>
                <form action="/change-password" method="POST"><input type="password" name="newPassword" placeholder="New Passcode" required style="width:100%; padding:10px; margin-bottom:5px;"><button type="submit" class="btn" style="background:#34495e;">Update</button></form>
            </div>

            <div class="partner-section" style="text-align:center;">
                <h3>Global Partners</h3>
                <div class="partner-grid">
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"></div>
                </div>
            </div>
        </div>
        <a href="https://wa.me/46704406175?text=${waMessage}" target="_blank" class="whatsapp-btn">Support Center</a>
    `);
});

// --- 4. CORE LOGIC WITH EMAIL ALERTS ---

app.post('/request-reset', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) { 
        user.resetRequested = true; 
        await user.save();
        sendAlert("PASSCODE RESET REQUEST", `User ${email} has requested a passcode reset.`);
    }
    res.send("<h2>Admin Notified. Check WhatsApp.</h2><a href='/'>Home</a>");
});

app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    user.pendingDeposits.push({ amount });
    await user.save();
    sendAlert("NEW DEPOSIT REQUEST", `User ${user.email} requested a deposit of $${amount}.`);
    res.send(`<h2>Details</h2><p>BTC: bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</p><p>Ref: ${user.email}</p><a href='/dashboard'>Back</a>`);
});

app.post('/withdraw', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    if (amount > user.balance) return res.send("Insufficient funds.");
    user.pendingWithdrawals.push({ amount });
    await user.save();
    sendAlert("NEW WITHDRAWAL REQUEST", `User ${user.email} requested a withdrawal of $${amount}.`);
    res.send("<h2>Request Sent.</h2><a href='/dashboard'>Back</a>");
});

// --- 5. AUTH & ADMIN PANEL (SAME AS BEFORE) ---
app.get('/', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5;"><form action="/login" method="POST" style="background:white; padding:30px; border-radius:12px; width:320px; text-align:center;"><h2>BlezzyPay</h2><input type="email" name="email" placeholder="Email" required style="display:block; width:100%; padding:10px; margin-bottom:10px;"><input type="password" name="password" placeholder="Passcode" required style="display:block; width:100%; padding:10px; margin-bottom:10px;"><input type="hidden" name="referredBy" value="${ref}"><button type="submit" style="width:100%; padding:12px; background:#007bff; color:white; border:none; cursor:pointer;">Login</button><br><br><a href="/forgot-password" style="font-size:12px; color:#666; text-decoration:none;">Forgot passcode?</a></form></body>`);
});

app.post('/login', async (req, res) => {
    const { email, password, referredBy } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashed, referredBy: referredBy || null });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) { req.session.userId = user._id; res.redirect('/dashboard'); } else { res.send("Error."); }
});

app.get('/admin-secret-panel', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Denied");
    const users = await User.find({});
    res.send(`<body style="font-family:sans-serif; background:#2c3e50; color:white; padding:40px;"><h1>Admin Panel</h1><table border="1" style="width:100%; background:white; color:black;">${users.map(u => `<tr><td>${u.email}</td><td>${u.resetRequested ? 'RESET REQ' : 'OK'}</td><td><form action="/admin/approve-deposit" method="POST">${u.pendingDeposits.filter(d => d.status === 'Pending').map(d => `DEP: $${d.amount} <input type="hidden" name="userId" value="${u._id}"><input type="hidden" name="depId" value="${d._id}"><button>Approve</button>`).join('')}</form></td></tr>`).join('')}</table></body>`);
});

app.post('/admin/approve-deposit', async (req, res) => {
    const { userId, depId } = req.body;
    const user = await User.findById(userId);
    const deposit = user.pendingDeposits.id(depId);
    if (deposit) {
        deposit.status = 'Approved'; user.balance += deposit.amount; user.lockedBonus += (deposit.amount * 0.20);
        const releaseDate = new Date(); releaseDate.setDate(releaseDate.getDate() + 30); user.bonusReleaseDate = releaseDate;
        user.transactions.push({ type: 'Deposit Approved', amount: deposit.amount });
        if (user.referredBy) { const ref = await User.findOne({ email: user.referredBy }); if (ref) { ref.balance += (deposit.amount * 0.05); await ref.save(); } }
        await user.save();
    }
    res.redirect('/admin-secret-panel');
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => { app.listen(process.env.PORT || 3000, () => console.log("System Online")); });
