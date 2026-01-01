const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'blezzy_pay_gold_2026', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 1. EMAIL SYSTEM ---
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

// --- 2. DATABASE SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBonus: { type: Number, default: 0 },
    agtTokens: { type: Number, default: 0 }, 
    referredBy: { type: String, default: null },
    activeRefsCount: { type: Number, default: 0 }, 
    hasReceivedMilestone: { type: Boolean, default: false },
    pendingDeposits: [{ amount: Number, status: { type: String, default: 'Pending' }, date: { type: Date, default: Date.now } }],
    transactions: [{ type: { type: String }, amount: Number, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);
const Settings = mongoose.model('Settings', new mongoose.Schema({ globalMessage: String }));

const MASTER_KEY = "BlezzyAdmin99#"; 

// --- 3. DASHBOARD (USER VIEW) ---
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    const isAdmin = user.email === "emmanuel.iyere84@gmail.com";
    const refLink = `${req.protocol}://${req.get('host')}/?ref=${user.email}`;
    const settings = await Settings.findOne({}) || { globalMessage: "" };

    res.send(`
        <head>
            <title>BlezzyPay Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"></script>
        </head>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #0b0e11; margin: 0; color: #eaeaea; }
            .ticker-wrap { width: 100%; overflow: hidden; background: #1e2329; color: #f0b90b; padding: 10px 0; border-bottom: 2px solid #f0b90b; }
            .ticker { display: flex; white-space: nowrap; animation: ticker 40s linear infinite; }
            .ticker-item { padding: 0 40px; font-size: 13px; font-weight: bold; }
            @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
            
            .card { background: #181a20; padding: 25px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); max-width: 900px; margin: 20px auto; border: 1px solid #2b2f36; }
            .agt-card { background: linear-gradient(135deg, #f0b90b 0%, #9a7807 100%); color: #000; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 20px 0; }
            .box { padding: 15px; border-radius: 10px; text-align: center; background: #2b2f36; border: 1px solid #2b2f36; }
            
            .progress-fill { background: #f0b90b; height: 10px; border-radius: 5px; width: ${(user.activeRefsCount / 50) * 100}%; max-width: 100%; transition: 0.5s; }
            .partner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; margin-top: 20px; }
            .partner-item { background: #fff; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; height: 45px; transition: 0.3s; }
            
            .contact-float { position: fixed; bottom: 20px; left: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }
            .c-btn { padding: 10px 15px; border-radius: 30px; color: white; text-decoration: none; font-size: 12px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        </style>

        <div class="ticker-wrap"><div class="ticker">
            <div class="ticker-item">GOLD (XAU/USD): <span id="gp">...</span></div>
            <div class="ticker-item">AGoldToken (AGT): COLLABORATION EAC • ECOWAS • EU</div>
            <div class="ticker-item">BTC: <span id="bp">...</span></div>
        </div></div>

        <div class="card">
            ${isAdmin ? `<a href="/admin-panel" style="background:#f0b90b; color:#000; padding:10px; border-radius:5px; text-decoration:none; font-weight:bold; display:inline-block; margin-bottom:20px;">🛠 MASTER ADMIN</a>` : ''}
            
            <div class="agt-card">
                <h3 style="margin:0;">AGoldToken (AGT) Vault</h3>
                <p style="font-size:12px;">Physical Gold-Backed Digital Asset. Price: $1.00/AGT</p>
                <form action="/reserve-agt" method="POST" style="display:flex; gap:10px; margin-top:10px;">
                    <input type="number" name="tokenAmount" placeholder="Amount" required style="flex:1; padding:10px; border-radius:5px; border:none;">
                    <button type="submit" style="background:#000; color:#f0b90b; padding:0 20px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">RESERVE</button>
                </form>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_the_East_African_Community.svg" height="15">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_ECOWAS.svg" height="15">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg" height="15">
                </div>
            </div>

            <div class="stats">
                <div class="box">Available<br><b>$${user.balance.toFixed(2)}</b></div>
                <div class="box">AI Yield<br><b>$${user.lockedBonus.toFixed(2)}</b></div>
                <div class="box">Vault (AGT)<br><b>${user.agtTokens}</b></div>
                <div class="box">Active Refs<br><b>${user.activeRefsCount}/50</b></div>
            </div>

            <div style="background:#1e2329; padding:15px; border-radius:10px; border:1px solid #2b2f36;">
                <h4 style="margin:0; color:#f0b90b;">$50 Promo Progress</h4>
                <div style="background:#444; height:10px; border-radius:5px; margin:10px 0;"><div class="progress-fill"></div></div>
                <small>Referral Link: <code>${refLink}</code></small>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:20px;">
                <div style="background:#1e2329; padding:15px; border-radius:10px;">
                    <h4>Deposit</h4>
                    <form action="/request-deposit" method="POST">
                        <input type="number" name="amount" placeholder="Amount ($)" required style="width:100%; padding:8px; background:#0b0e11; border:1px solid #444; color: #eaeaea; border-radius: 5px; margin-bottom: 10px;">
                        <button class="c-btn" style="background:#f0b90b; color:#000; border:none; width:100%; cursor:pointer;">REQUEST DEPOSIT</button>
                    </form>
                </div>

                <div style="background:#1e2329; padding:15px; border-radius:10px;">
                    <h4>Withdraw</h4>
                     <form action="/withdraw" method="POST">
                        <input type="number" name="amount" placeholder="Amount ($)" required style="width:100%; padding:8px; background:#0b0e11; border:1px solid #444; color: #eaeaea; border-radius: 5px; margin-bottom: 10px;">
                        <input type="text" name="wallet" placeholder="USDT TRC20 Address" required style="width:100%; padding:8px; background:#0b0e11; border:1px solid #444; color: #eaeaea; border-radius: 5px; margin-bottom: 10px;">
                        <button class="c-btn" style="background:#444; color:#fff; border:none; width:100%; cursor:pointer;">WITHDRAW FUNDS</button>
                    </form>
                </div>
            </div>

            <h3 style="margin-top:30px;">Recent Activity</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="background:#2b2f36; text-align:left;">
                    <th style="padding:10px;">Type</th>
                    <th style="padding:10px;">Amount</th>
                    <th style="padding:10px;">Status/Date</th>
                </tr>
                ${user.pendingDeposits.map(d => `
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36; color:#f0b90b;">Pending Deposit</td>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36;">$${d.amount}</td>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36;">${d.status}</td>
                    </tr>
                `).join('')}
                ${user.transactions.slice().reverse().map(t => `
                    <tr>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36;">${t.type}</td>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36;">$${t.amount}</td>
                        <td style="padding:10px; border-bottom:1px solid #2b2f36;">${t.date.toDateString()}</td>
                    </tr>
                `).join('')}
            </table>
            
            <div class="partner-grid">
                <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" height="25"></div>
                <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" height="25"></div>
                <div class="partner-item"><img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" height="25"></div>
            </div>

            <div class="contact-float">
                <a href="#" class="c-btn" style="background:#25D366;">WhatsApp Help</a>
                <a href="/logout" class="c-btn" style="background:#ff4757;">Logout</a>
            </div>
        </div>

        <script>
            // Live Mock Prices
            setInterval(() => {
                document.getElementById('gp').innerText = '$' + (2650 + Math.random() * 5).toFixed(2);
                document.getElementById('bp').innerText = '$' + (98000 + Math.random() * 100).toFixed(2);
            }, 3000);
        </script>
    `);
});

// --- 4. FUNCTIONAL ROUTES ---

// Handle Deposit Requests
app.post('/request-deposit', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    try {
        const amount = parseFloat(req.body.amount);
        if (amount > 0) {
            await User.findByIdAndUpdate(req.session.userId, {
                $push: { pendingDeposits: { amount: amount, status: 'Pending Review' } }
            });
            // Optional: Notify Admin via Email here
        }
        res.redirect('/dashboard');
    } catch (e) { console.log(e); res.redirect('/dashboard'); }
});

// Handle AGT Token Reservation
app.post('/reserve-agt', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    try {
        const user = await User.findById(req.session.userId);
        const amount = parseFloat(req.body.tokenAmount);
        const cost = amount * 1.00; // $1 per token

        if (user.balance >= cost) {
            user.balance -= cost;
            user.agtTokens += amount;
            user.transactions.push({ type: 'AGT Purchase', amount: cost });
            await user.save();
        }
        res.redirect('/dashboard');
    } catch (e) { console.log(e); res.redirect('/dashboard'); }
});

// Handle Withdrawals
app.post('/withdraw', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    // Logic: Deduct balance immediately or create a pending withdrawal request
    // For safety, we usually create a pending request.
    try {
        const user = await User.findById(req.session.userId);
        const amount = parseFloat(req.body.amount);
        if(user.balance >= amount) {
             user.balance -= amount;
             user.transactions.push({ type: 'Withdrawal Request', amount: amount });
             await user.save();
             // Send email to admin about withdrawal
        }
        res.redirect('/dashboard');
    } catch(e) { console.log(e); res.redirect('/dashboard'); }
});

// --- 5. ADMIN PANEL ---
app.get('/admin-panel', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    // Strict Admin Check
    if (user.email !== "emmanuel.iyere84@gmail.com") return res.send("Access Denied");

    const allUsers = await User.find({});
    
    // Simple Admin HTML
    let html = `
    <body style="font-family:sans-serif; padding:20px; background:#eee;">
        <h1>Master Admin Panel</h1>
        <p>Total Users: ${allUsers.length}</p>
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

// Admin Action: Approve Deposit
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
            await sendEmail(user.email, "Deposit Approved", `Your deposit of $${deposit.amount} has been credited.`);
        }
        res.redirect('/admin-panel');
    } catch (e) { res.send(e.message); }
});

// --- 6. AUTH ROUTES (Login/Register/Logout) ---
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
