const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');

// --- 1. INITIALIZE APP (This fixes your error) ---
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'blezzy_pay_gold_2026', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 2. EMAIL SYSTEM ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"BlezzyPay Finance" <${process.env.EMAIL_USER}>`,
            to: to, subject: subject, text: text
        });
    } catch (err) { console.log("Mail Error:", err); }
};

// --- 3. DATABASE SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBonus: { type: Number, default: 0 },
    agtTokens: { type: Number, default: 0 }, 
    transactions: [{ type: { type: String }, amount: Number, date: { type: Date, default: Date.now } }],
    pendingDeposits: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);

const MASTER_KEY = "BlezzyAdmin99#"; 

// --- 4. THE NEW DASHBOARD UI (The Design You Wanted) ---
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    
    // Mock logic for the UI visualization
    const billsDue = 300; 
    const available = user.balance; // Simplified for display
    const percentage = Math.min(100, Math.max(0, (user.balance / 5000) * 100)); 

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BlezzyPay Smart Wallet</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                :root {
                    --bg-dark: #0f1216; --card-bg: #1c2026; --text-main: #ffffff;
                    --text-muted: #8b95a5; --accent-green: #34d399; --accent-orange: #fb923c;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; outline: none; -webkit-tap-highlight-color: transparent; }
                body { background-color: var(--bg-dark); font-family: 'Inter', sans-serif; color: var(--text-main); display: flex; justify-content: center; min-height: 100vh; }
                .app-container { width: 100%; max-width: 420px; padding: 20px 24px; position: relative; padding-bottom: 100px; }
                .header-meta { margin-top: 10px; margin-bottom: 24px; }
                .time { font-size: 14px; font-weight: 500; }
                .date { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
                .feed-label { float: right; font-size: 12px; color: var(--text-muted); margin-top: -35px; }
                .insights-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
                .insight-pill { min-width: 220px; padding: 16px; border-radius: 24px; background: rgba(255,255,255,0.03); display: flex; flex-direction: column; justify-content: space-between; position: relative; font-size: 13px; line-height: 1.4; }
                .pill-green { border: 1px solid rgba(52, 211, 153, 0.3); box-shadow: 0 0 15px rgba(52, 211, 153, 0.1) inset; }
                .pill-green .arrow { color: var(--accent-green); align-self: flex-end; margin-top: 8px; }
                .pill-orange { border: 1px solid rgba(251, 146, 60, 0.3); box-shadow: 0 0 15px rgba(251, 146, 60, 0.1) inset; }
                .pill-orange .arrow { color: var(--accent-orange); align-self: flex-end; margin-top: 8px; }
                .balance-card { background: #1e222b; border-radius: 28px; padding: 24px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
                .bal-amount { font-size: 36px; font-weight: 700; letter-spacing: -1px; }
                .chart-container { width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(var(--accent-green) ${percentage}%, #2c333e 0); display: flex; align-items: center; justify-content: center; }
                .chart-inner { width: 58px; height: 58px; background: #1e222b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text-muted); }
                .section-title { margin-top: 32px; margin-bottom: 16px; font-size: 15px; font-weight: 500; }
                .t-card { background: #1e222b; border-radius: 20px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
                .t-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
                .icon-starbucks { background: #1a382e; color: #00d2aa; }
                .icon-netflix { background: #000; color: #e50914; }
                .icon-deposit { background: #162822; color: #2ecc71; }
                .icon-withdraw { background: #2a1818; color: #e74c3c; }
                .t-info { flex: 1; margin-left: 14px; }
                .t-name { font-size: 14px; font-weight: 500; color: #fff; }
                .t-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
                .t-amount { font-size: 15px; font-weight: 600; text-align: right; }
                .bottom-dock { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(30, 35, 41, 0.85); backdrop-filter: blur(12px); padding: 12px 30px; border-radius: 40px; display: flex; gap: 40px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.5); z-index: 100; }
                .dock-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
                .dock-circle { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 6px; }
                .btn-scan { background: linear-gradient(135deg, #355c7d, #6c5b7b); border: 2px solid #5fa699; }
                .btn-send { background: linear-gradient(135deg, #1d976c, #93f9b9); color: #000; border: 2px solid #6ed1a6; }
                .btn-topup { background: linear-gradient(135deg, #f09819, #edde5d); color: #000; border: 2px solid #f2c94c; }
                .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; align-items: flex-end; }
                .modal-content { background: #1c2026; width: 100%; border-radius: 24px 24px 0 0; padding: 30px; animation: slideUp 0.3s ease; }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                input { width: 100%; padding: 15px; background: #0f1216; border: 1px solid #333; color: white; border-radius: 12px; margin-bottom: 15px; }
                .submit-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; background: var(--accent-green); color: #000; }
                .close-modal { float: right; font-size: 20px; cursor: pointer; color: #fff; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="app-container">
                <div class="header-meta">
                    <div class="time">10:00 AM</div>
                    <div class="date">Mon, Oct 26, 2026</div>
                    <div class="feed-label">Predictive Insights Feed</div>
                </div>
                <div class="insights-scroll">
                    <div class="insight-pill pill-green"><span>You're $50 under budget. Move to savings?</span><i class="fa-solid fa-arrow-right arrow"></i></div>
                    <div class="insight-pill pill-orange"><span>Utility bill detected: Pay now.</span><i class="fa-solid fa-arrow-right arrow"></i></div>
                </div>
                <div class="balance-card">
                    <div>
                        <div style="font-size:14px; font-weight:500; margin-bottom:8px;">Smart Balance</div>
                        <div class="bal-amount">$${available.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:8px;">available — $${billsDue} due tomorrow</div>
                    </div>
                    <div class="chart-container"><div class="chart-inner">${Math.round(percentage)}%</div></div>
                </div>
                <div class="section-title">Smart Transaction <br><span style="font-size:12px; color:#6b7280; font-weight:400;">TODAY</span></div>
                
                ${user.transactions.slice().reverse().slice(0, 5).map(t => {
                    let iconClass = 'fa-arrow-right-arrow-left';
                    let bgClass = 'background:#333;';
                    let isNegative = t.type === 'Withdrawal Request' || t.type === 'AGT Purchase';
                    
                    if(t.type.includes('Starbucks')) { iconClass = 'fa-mug-hot'; bgClass = 'icon-starbucks'; }
                    else if(t.type.includes('Netflix')) { iconClass = 'fa-film'; bgClass = 'icon-netflix'; }
                    else if(t.type.includes('Deposit')) { iconClass = 'fa-arrow-down'; bgClass = 'icon-deposit'; isNegative = false; }
                    else { iconClass = 'fa-arrow-up'; bgClass = 'icon-withdraw'; }

                    return `
                    <div class="t-card">
                        <div class="t-icon" style="${bgClass}"><i class="fa-solid ${iconClass}"></i></div>
                        <div class="t-info"><div class="t-name">${t.type}</div><div class="t-meta">Transaction</div></div>
                        <div class="t-amount" style="color: ${isNegative ? '#fff' : '#2ecc71'}">${isNegative ? '-' : '+'}$${t.amount.toFixed(2)}</div>
                    </div>`;
                }).join('')}
                
                <div style="text-align:center; margin-top:20px; color:#555; font-size:12px;">Admin? <a href="/admin-panel" style="color:#777;">Login here</a></div>
            </div>

            <div class="bottom-dock">
                <div class="dock-item" onclick="openModal('withdraw')"><div class="dock-circle btn-scan"><i class="fa-solid fa-qrcode"></i></div><div class="dock-label">Scan/Pay</div></div>
                <div class="dock-item" onclick="openModal('transfer')"><div class="dock-circle btn-send"><i class="fa-regular fa-paper-plane"></i></div><div class="dock-label">Send</div></div>
                <div class="dock-item" onclick="openModal('deposit')"><div class="dock-circle btn-topup"><i class="fa-solid fa-plus"></i></div><div class="dock-label">Top Up</div></div>
            </div>

            <div id="depositModal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModals()">&times;</span>
                    <h3>Top Up Balance</h3>
                    <form action="/request-deposit" method="POST">
                        <input type="number" name="amount" placeholder="Amount ($)" required>
                        <button class="submit-btn">Request Deposit</button>
                    </form>
                </div>
            </div>
            
             <div id="withdrawModal" class="modal">
                <div class="modal-content">
                    <span class="close-modal" onclick="closeModals()">&times;</span>
                    <h3>Pay / Withdraw</h3>
                    <form action="/withdraw" method="POST">
                        <input type="number" name="amount" placeholder="Amount ($)" required>
                        <input type="text" name="wallet" placeholder="Recipient / Wallet Addr" required>
                        <button class="submit-btn" style="background:var(--accent-orange);">Send Payment</button>
                    </form>
                </div>
            </div>

            <script>
                const timeEl = document.querySelector('.time');
                setInterval(() => { const now = new Date(); timeEl.innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }, 1000);
                function openModal(type) {
                    if(type === 'deposit') document.getElementById('depositModal').style.display = 'flex';
                    if(type === 'withdraw' || type === 'transfer') document.getElementById('withdrawModal').style.display = 'flex';
                }
                function closeModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
                window.onclick = function(event) { if (event.target.classList.contains('modal')) closeModals(); }
            </script>
        </body>
        </html>
    `);
});

// --- 5. FUNCTIONAL ROUTES ---
app.post('/request-deposit', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    try {
        const amount = parseFloat(req.body.amount);
        if (amount > 0) {
            await User.findByIdAndUpdate(req.session.userId, {
                $push: { pendingDeposits: { amount: amount, status: 'Pending Review' } }
            });
        }
        res.redirect('/dashboard');
    } catch (e) { console.log(e); res.redirect('/dashboard'); }
});

app.post('/withdraw', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    try {
        const user = await User.findById(req.session.userId);
        const amount = parseFloat(req.body.amount);
        if(user.balance >= amount) {
             user.balance -= amount;
             user.transactions.push({ type: 'Withdrawal Request', amount: amount });
             await user.save();
        }
        res.redirect('/dashboard');
    } catch(e) { console.log(e); res.redirect('/dashboard'); }
});

app.get('/admin-panel', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    if (user.email !== "emmanuel.iyere84@gmail.com") return res.send("Access Denied");
    const allUsers = await User.find({});
    
    let html = `
    <body style="font-family:sans-serif; padding:20px; background:#eee;">
        <h1>Master Admin Panel</h1>
        <table border="1" cellpadding="10" style="border-collapse:collapse; background:#fff; width:100%;">
            <tr><th>Email</th><th>Balance</th><th>Pending Deposits</th><th>Action</th></tr>
            ${allUsers.map(u => {
                const pending = u.pendingDeposits.filter(d => d.status === 'Pending Review');
                return pending.map(p => `
                    <tr>
                        <td>${u.email}</td>
                        <td>$${u.balance}</td>
                        <td>$${p.amount}</td>
                        <td>
                            <form action="/admin/approve-deposit" method="POST">
                                <input type="hidden" name="userId" value="${u._id}">
                                <input type="hidden" name="depositId" value="${p._id}">
                                <input type="password" name="masterKey" placeholder="Master Key" required>
                                <button type="submit" style="background:green; color:white;">Approve</button>
                            </form>
                        </td>
                    </tr>
                `).join('');
            }).join('')}
        </table>
        <br><a href="/dashboard">Back to Dashboard</a>
    </body>`;
    res.send(html);
});

app.post('/admin/approve-deposit', async (req, res) => {
    const { userId, depositId, masterKey } = req.body;
    if (masterKey !== MASTER_KEY) return res.send("Invalid Master Key");
    try {
        const user = await User.findById(userId);
        const deposit = user.pendingDeposits.id(depositId);
        if (deposit && deposit.status === 'Pending Review') {
            deposit.status = 'Completed';
            user.balance += deposit.amount;
            user.transactions.push({ type: 'Deposit', amount: deposit.amount });
            await user.save();
        }
        res.redirect('/admin-panel');
    } catch (e) { res.send(e.message); }
});

// --- 6. AUTH ROUTES ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0b0e11; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <div style="text-align:center;">
                <h1 style="color:#f0b90b;">BlezzyPay Finance</h1>
                <form action="/login" method="POST" style="display:flex; flex-direction:column; gap:10px; width:300px;">
                    <input type="email" name="email" placeholder="Email" required style="padding:10px;">
                    <input type="password" name="password" placeholder="Password" required style="padding:10px;">
                    <button type="submit" style="padding:10px; background:#f0b90b; border:none; font-weight:bold;">LOGIN</button>
                </form>
                <br>
                <form action="/register" method="POST" style="display:flex; flex-direction:column; gap:10px; width:300px;">
                    <input type="email" name="email" placeholder="New Email" required style="padding:10px;">
                    <input type="password" name="password" placeholder="New Password" required style="padding:10px;">
                    <button type="submit" style="padding:10px; background:#444; color:#fff; border:none;">REGISTER</button>
                </form>
            </div>
        </body>
    `);
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({ email: req.body.email, password: hashedPassword });
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } catch (e) { res.send("Error: Email likely exists."); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } else {
        res.send("Invalid credentials <a href='/'>Try Again</a>");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- 7. SERVER START ---
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blezzyDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));
