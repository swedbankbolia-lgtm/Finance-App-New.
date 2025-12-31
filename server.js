const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'finance_secret', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 1. USER SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBonus: { type: Number, default: 0 },
    bonusReleaseDate: { type: Date },
    referredBy: { type: String, default: null },
    pendingDeposits: [{
        amount: Number,
        status: { type: String, default: 'Pending' },
        date: { type: Date, default: Date.now }
    }],
    transactions: [{
        type: { type: String },
        amount: Number,
        date: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', UserSchema);

// --- 2. AUTH & DASHBOARD ---

app.get('/', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`
        <head>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            </script>
        </head>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; margin:0; }
            .login-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 320px; }
            input { display: block; width: 100%; margin: 10px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight:bold; }
        </style>
        <div class="login-card">
            <h2>Finance App</h2>
            <form action="/login" method="POST">
                <input type="email" name="email" placeholder="Email Address" required>
                <input type="password" name="password" placeholder="Password" required>
                <input type="hidden" name="referredBy" value="${ref}">
                <button type="submit">Login / Register</button>
            </form>
        </div>
    `);
});

app.post('/login', async (req, res) => {
    const { email, password, referredBy } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashed, referredBy: referredBy || null });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } else { res.send("Invalid credentials. <a href='/'>Try again</a>"); }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';
    const protocol = req.protocol;
    const host = req.get('host');
    const referralLink = `${protocol}://${host}/?ref=${user.email}`;
    const waMessage = encodeURIComponent("Welcome to the right place where your money grows with certainty...");

    res.send(`
        <head>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            </script>
        </head>
        <style>
            body { font-family: sans-serif; background: #f4f7f6; padding: 0; margin: 0; color: #333; }
            .ticker-wrap { width: 100%; overflow: hidden; background: #2c3e50; color: #fff; padding: 10px 0; border-bottom: 2px solid #f39c12; }
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
            input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin: 5px 0; width: 100%; box-sizing: border-box; }
            .btn { padding: 10px 20px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
            .btn-dep { background: #27ae60; }
            .partner-section { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; }
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 20px; }
            .partner-item { font-size: 11px; padding: 10px; background: #f9f9f9; border-radius: 5px; text-decoration: none; color: #7f8c8d; font-weight: bold; }
        </style>

        <div class="ticker-wrap">
            <div class="ticker">
                <div class="ticker-item">ROADMAP: <span style="color:#f1c40f;">New Gold-Backed Token in 12 Months!</span></div>
                <div class="ticker-item">BITCOIN: <span id="btc-price">...</span></div>
                <div class="ticker-item">AI TRADING: <span style="color:#2ecc71;">20% Fixed Monthly Yield</span></div>
            </div>
        </div>

        <div class="card">
            <h2>Finance Dashboard</h2>
            <div class="stats-grid">
                <div class="box balance-box">
                    <p>Available Balance</p>
                    <div class="amount">$${user.balance.toFixed(2)}</div>
                </div>
                <div class="box bonus-box">
                    <p>Locked Bonus (20%)</p>
                    <div class="amount">$${user.lockedBonus.toFixed(2)}</div>
                    <small>Unlocks: ${dateStr}</small>
                </div>
            </div>

            <div class="section">
                <h3>Affiliate Program</h3>
                <p style="font-size:13px;">Refer friends and earn 5% on their deposits!</p>
                <div style="background:#eee; padding:10px; border-radius:5px;"><code>${referralLink}</code></div>
            </div>

            <div class="section">
                <h3>Deposit & Trade</h3>
                <form action="/deposit" method="POST">
                    <input type="number" name="amount" placeholder="Amount" step="0.01" required>
                    <button type="submit" class="btn btn-dep">Request Payment Details</button>
                </form>
            </div>

            <div class="partner-section">
                <h3>Global Partners</h3>
                <div class="partner-grid">
                    <a href="https://www.binance.com" class="partner-item">Binance</a>
                    <a href="https://www.coinbase.com" class="partner-item">Coinbase</a>
                    <a href="https://www.hsbc.com.hk" class="partner-item">HSBC</a>
                    <a href="https://www.ecobank.com" class="partner-item">Ecobank</a>
                </div>
            </div>
        </div>

        <a href="https://wa.me/46704406175?text=${waMessage}" target="_blank" style="position:fixed; bottom:30px; right:30px; background:#25d366; color:white; padding:15px 25px; border-radius:50px; text-decoration:none; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2);">Chat Support</a>

        <script>
            async function getPrices() {
                try {
                    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                    const data = await res.json();
                    document.getElementById('btc-price').innerText = '$' + data.bitcoin.usd.toLocaleString();
                } catch (e) {}
            }
            getPrices(); setInterval(getPrices, 60000);
        </script>
    `);
});

// --- 3. CORE LOGIC ---

app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    user.pendingDeposits.push({ amount: amount });
    await user.save();
    res.send(`
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f7f6;">
            <div style="background:white; padding:30px; border-radius:12px; display:inline-block; border:1px solid #ddd;">
                <h2>Payment Details</h2>
                <div style="text-align:left; background:#eee; padding:15px; border-radius:8px; font-size:14px;">
                    <strong>BTC:</strong> bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7<br>
                    <strong>US Bank:</strong> Bank of America | 026009593<br>
                    <strong>EU Barclay:</strong> GB33BARC20658259151311<br>
                    <strong>SA Capitek:</strong> 1882242481<br>
                    <strong>Uganda Equity:</strong> 1003103498481
                </div>
                <p>Reference: <strong>${user.email}</strong></p>
                <a href="/dashboard"><button style="padding:10px 20px; cursor:pointer;">Back to Dashboard</button></a>
            </div>
        </body>
    `);
});

app.post('/admin/approve-deposit', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Denied");
    const { userId, depId } = req.body;
    const user = await User.findById(userId);
    const deposit = user.pendingDeposits.id(depId);
    if (deposit && deposit.status === 'Pending') {
        deposit.status = 'Approved';
        user.balance += deposit.amount;
        user.lockedBonus += (deposit.amount * 0.20);
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + 30);
        user.bonusReleaseDate = releaseDate;
        user.transactions.push({ type: 'Deposit Approved', amount: deposit.amount });

        if (user.referredBy) {
            const referrer = await User.findOne({ email: user.referredBy });
            if (referrer) {
                const commission = deposit.amount * 0.05;
                referrer.balance += commission;
                referrer.transactions.push({ type: `Affiliate Reward (${user.email})`, amount: commission });
                await referrer.save();
            }
        }
        await user.save();
    }
    res.redirect('/admin-secret-panel');
});

app.get('/admin-secret-panel', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Denied");
    const users = await User.find({});
    res.send(`
        <body style="font-family:sans-serif; background:#2c3e50; color:white; padding:40px;">
            <h2>Approval Center</h2>
            <table border="1" style="width:100%; background:white; color:black; border-collapse:collapse;">
                ${users.map(u => `
                    <tr>
                        <td style="padding:10px;">${u.email}</td>
                        <td>
                            ${u.pendingDeposits.filter(d => d.status === 'Pending').map(dep => `
                                <form action="/admin/approve-deposit" method="POST">
                                    $${dep.amount} <input type="hidden" name="userId" value="${u._id}">
                                    <input type="hidden" name="depId" value="${dep._id}">
                                    <button type="submit">Approve Payment</button>
                                </form>
                            `).join('') || 'None'}
                        </td>
                        <td>Ref By: ${u.referredBy || 'Direct'}</td>
                    </tr>
                `).join('')}
            </table>
            <br><a href="/dashboard" style="color:white;">Dashboard</a>
        </body>
    `);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("Live"));
});
