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
    pendingDeposits: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    pendingWithdrawals: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    transactions: [{ type: { type: String }, amount: Number, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);

// --- 2. DASHBOARD ---

app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';
    const referralLink = `${req.protocol}://${req.get('host')}/?ref=${user.email}`;
    const waMessage = encodeURIComponent("Welcome to the right place where your money grows with certainty...");

    res.send(`
        <style>
            body { font-family: sans-serif; background: #f4f7f6; margin: 0; color: #333; }
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
            .btn { padding: 12px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 20px; margin-top: 20px; }
            .partner-item img { max-height: 30px; filter: grayscale(100%); opacity: 0.6; }
            .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25d366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; }
        </style>

        <div class="ticker-wrap">
            <div class="ticker">
                <div class="ticker-item">ROADMAP: <span style="color:#f1c40f;">New Gold-Backed Token Launching in 12 Months!</span></div>
                <div class="ticker-item">BITCOIN: <span id="btc-price">...</span></div>
                <div class="ticker-item">AI YIELD: <span style="color:#2ecc71;">20% Monthly Fixed</span></div>
            </div>
        </div>

        <div class="card">
            <div style="display:flex; justify-content:space-between;">
                <h2>Wallet Overview</h2>
                <a href="/logout" style="color:#e74c3c; text-decoration:none;">Logout</a>
            </div>

            <div class="stats-grid">
                <div class="box balance-box">
                    <p>Available for Withdrawal</p>
                    <div class="amount">$${user.balance.toFixed(2)}</div>
                </div>
                <div class="box bonus-box">
                    <p>Locked Trading Yield (20%)</p>
                    <div class="amount">$${user.lockedBonus.toFixed(2)}</div>
                    <small>Unlocks: ${dateStr}</small>
                </div>
            </div>

            <div class="section">
                <h3>Financial Operations</h3>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <form action="/deposit" method="POST">
                        <input type="number" name="amount" placeholder="Deposit Amount" required style="width:100%; padding:10px; margin-bottom:5px;">
                        <button type="submit" class="btn" style="background:#27ae60;">Deposit / Stake</button>
                    </form>
                    <form action="/withdraw" method="POST">
                        <input type="number" name="amount" placeholder="Withdraw Amount" required style="width:100%; padding:10px; margin-bottom:5px;">
                        <button type="submit" class="btn" style="background:#e67e22;">Request Payout</button>
                    </form>
                </div>
            </div>

            <div class="section">
                <h3>Recent Activity</h3>
                <table>
                    <thead><tr><th>Activity</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                        ${user.transactions.slice().reverse().map(t => `
                            <tr><td>${t.type}</td><td>$${t.amount.toFixed(2)}</td><td style="color:green;">Completed</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h3>Affiliate Link</h3>
                <code style="background:#eee; padding:5px; display:block;">${referralLink}</code>
            </div>

            <div class="partner-section" style="text-align:center;">
                <p style="font-size:12px; color:#999;">Institutional Partners</p>
                <div class="partner-grid">
                    <img src="https://logo.clearbit.com/binance.com">
                    <img src="https://logo.clearbit.com/hsbc.com">
                    <img src="https://logo.clearbit.com/coinbase.com">
                    <img src="https://logo.clearbit.com/amazon.com">
                </div>
            </div>
        </div>

        <a href="https://wa.me/46704406175?text=${waMessage}" target="_blank" class="whatsapp-btn">Support Center</a>

        <script>
            async function getPrices() {
                const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
                const data = await res.json();
                document.getElementById('btc-price').innerText = '$' + data.bitcoin.usd.toLocaleString();
            }
            getPrices(); setInterval(getPrices, 60000);
        </script>
    `);
});

// --- 3. WITHDRAWAL LOGIC ---

app.post('/withdraw', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    if (amount > user.balance) return res.send("Insufficient balance.");
    if (amount < 10) return res.send("Minimum withdrawal is $10.");

    user.pendingWithdrawals.push({ amount: amount });
    await user.save();
    res.send(`
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>Withdrawal Requested</h2>
            <p>Your request for <strong>$${amount.toFixed(2)}</strong> is being processed.</p>
            <p>Admin will contact you to confirm your payout details.</p>
            <a href="/dashboard">Return to Dashboard</a>
        </body>
    `);
});

app.post('/admin/approve-withdrawal', async (req, res) => {
    const admin = await User.findById(req.session.userId);
    if (admin.email !== "emmanuel.iyere84@gmail.com") return res.send("Denied");
    
    const { userId, witId } = req.body;
    const user = await User.findById(userId);
    const withdrawal = user.pendingWithdrawals.id(witId);

    if (withdrawal && withdrawal.status === 'Pending') {
        withdrawal.status = 'Approved';
        user.balance -= withdrawal.amount;
        user.transactions.push({ type: 'Withdrawal Approved', amount: withdrawal.amount });
        await user.save();
    }
    res.redirect('/admin-secret-panel');
});

// --- 4. DEPOSIT & ADMIN PANEL ---

app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    user.pendingDeposits.push({ amount: amount });
    await user.save();
    res.send("<body style='font-family:sans-serif; text-align:center; padding:50px;'><h2>Details Sent</h2><p>Send funds to BTC: bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</p><a href='/dashboard'>Back</a></body>");
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
        const releaseDate = new Date(); releaseDate.setDate(releaseDate.getDate() + 30);
        user.bonusReleaseDate = releaseDate;
        user.transactions.push({ type: 'Deposit Approved', amount: deposit.amount });
        if (user.referredBy) {
            const ref = await User.findOne({ email: user.referredBy });
            if (ref) { ref.balance += (deposit.amount * 0.05); ref.transactions.push({ type: 'Referral Reward', amount: (deposit.amount * 0.05) }); await ref.save(); }
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
        <body style="font-family:sans-serif; padding:40px; background:#2c3e50; color:white;">
            <h1>Admin Control Center</h1>
            <table border="1" style="width:100%; background:white; color:black; border-collapse:collapse;">
                <tr style="background:#eee;"><th>User</th><th>Action Required</th></tr>
                ${users.map(u => `
                    <tr>
                        <td style="padding:10px;">${u.email}</td>
                        <td style="padding:10px;">
                            ${u.pendingDeposits.filter(d => d.status === 'Pending').map(d => `
                                <form action="/admin/approve-deposit" method="POST">
                                    DEP: $${d.amount} <input type="hidden" name="userId" value="${u._id}"><input type="hidden" name="depId" value="${d._id}">
                                    <button style="background:green; color:white;">Approve Deposit</button>
                                </form>
                            `).join('')}
                            ${u.pendingWithdrawals.filter(w => w.status === 'Pending').map(w => `
                                <form action="/admin/approve-withdrawal" method="POST">
                                    WIT: $${w.amount} <input type="hidden" name="userId" value="${u._id}"><input type="hidden" name="witId" value="${w._id}">
                                    <button style="background:orange; color:white;">Confirm Payout</button>
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

app.get('/', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5;">
        <form action="/login" method="POST" style="background:white; padding:30px; border-radius:8px;">
            <h2>Finance Login</h2>
            <input type="email" name="email" placeholder="Email" required style="display:block; width:100%; margin-bottom:10px; padding:10px;">
            <input type="password" name="password" placeholder="Password" required style="display:block; width:100%; margin-bottom:10px; padding:10px;">
            <input type="hidden" name="referredBy" value="${ref}">
            <button type="submit" style="width:100%; padding:10px; background:#007bff; color:white; border:none;">Access Wallet</button>
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
    if (match) { req.session.userId = user._id; res.redirect('/dashboard'); } else { res.send("Invalid"); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => { app.listen(process.env.PORT || 3000, () => console.log("Live")); });
