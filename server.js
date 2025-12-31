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

// --- 1. USER SCHEMA (Includes Balance, Locked Bonus, and History) ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBonus: { type: Number, default: 0 },
    bonusReleaseDate: { type: Date },
    transactions: [{
        type: { type: String },
        amount: Number,
        date: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', UserSchema);

// --- 2. ROUTES ---

// Home/Login Page
app.get('/', (req, res) => {
    res.send(`
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
                <button type="submit">Login / Register</button>
            </form>
        </div>
    `);
});

// Login/Register Logic
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        const hashed = await bcrypt.hash(password, 10);
        user = await User.create({ email, password: hashed });
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } else { res.send("Invalid credentials. <a href='/'>Try again</a>"); }
});

// Dashboard View
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);

    const canClaim = user.bonusReleaseDate && new Date() >= user.bonusReleaseDate;
    const dateStr = user.bonusReleaseDate ? user.bonusReleaseDate.toLocaleDateString() : 'N/A';

    res.send(`
        <style>
            body { font-family: sans-serif; background: #f4f7f6; padding: 20px; }
            .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 650px; margin: auto; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .box { padding: 20px; border-radius: 8px; text-align: center; color: white; }
            .balance-box { background: #2ecc71; }
            .bonus-box { background: #f39c12; }
            .amount { font-size: 28px; font-weight: bold; }
            .section { margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
            input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin: 5px 0; width: 100%; box-sizing: border-box; }
            .btn { padding: 10px 20px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
            .btn-dep { background: #27ae60; } .btn-wit { background: #e74c3c; } .btn-tra { background: #3498db; } .btn-claim { background: #8e44ad; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
        </style>

        <div class="card">
            <h2>Financial Dashboard</h2>
            <p>Welcome: <strong>${user.email}</strong></p>
            
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

            ${user.lockedBonus > 0 ? `
                <form action="/claim-bonus" method="POST" class="section">
                    <p>Claim your 20% compensation after 30 days.</p>
                    <button type="submit" class="btn btn-claim" ${!canClaim ? 'disabled' : ''}>
                        ${canClaim ? 'Claim Bonus Now' : 'Bonus Currently Locked'}
                    </button>
                </form>
            ` : ''}

            <div class="section">
                <h3>Deposit & Withdraw</h3>
                <form action="/deposit" method="POST">
                    <input type="number" name="amount" placeholder="Deposit Amount" step="0.01" required>
                    <button type="submit" class="btn btn-dep">Deposit + 20% Bonus</button>
                </form>
                <form action="/withdraw" method="POST" style="margin-top:10px;">
                    <input type="number" name="amount" placeholder="Withdraw Amount" step="0.01" required>
                    <button type="submit" class="btn btn-wit">Withdraw</button>
                </form>
            </div>

            <div class="section">
                <h3>Transfer Money</h3>
                <form action="/transfer" method="POST">
                    <input type="email" name="recipientEmail" placeholder="Recipient Email" required>
                    <input type="number" name="amount" placeholder="Amount to Send" step="0.01" required>
                    <button type="submit" class="btn btn-tra">Send Money</button>
                </form>
            </div>

            <h3>History</h3>
            <table>
                <tr><th>Type</th><th>Amount</th><th>Date</th></tr>
                ${user.transactions.slice().reverse().map(t => `
                    <tr>
                        <td style="color: ${t.type.includes('Deposit') || t.type.includes('In') ? 'green' : 'red'}"><strong>${t.type}</strong></td>
                        <td>$${t.amount.toFixed(2)}</td>
                        <td>${new Date(t.date).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </table>
            <p style="text-align:center; margin-top:20px;"><a href="/logout">Logout</a></p>
        </div>
    `);
});

// --- 3. CORE LOGIC ---

// Deposit + 20% Bonus
app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (amount <= 0) return res.send("Invalid amount");
    const user = await User.findById(req.session.userId);
    
    user.balance += amount;
    const bonus = amount * 0.20;
    user.lockedBonus += bonus;
    
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 30); // 30 Day Lock
    user.bonusReleaseDate = releaseDate;

    user.transactions.push({ type: 'Deposit', amount: amount });
    user.transactions.push({ type: 'Locked Bonus', amount: bonus });
    await user.save();
    res.redirect('/dashboard');
});

// Claiming the Bonus
app.post('/claim-bonus', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (new Date() < user.bonusReleaseDate) return res.send("Bonus is still locked!");
    
    user.balance += user.lockedBonus;
    user.transactions.push({ type: 'Bonus Claimed', amount: user.lockedBonus });
    user.lockedBonus = 0;
    await user.save();
    res.redirect('/dashboard');
});

// Withdraw
app.post('/withdraw', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    if (amount > user.balance) return res.send("Insufficient funds.");
    user.balance -= amount;
    user.transactions.push({ type: 'Withdraw', amount: amount });
    await user.save();
    res.redirect('/dashboard');
});

// Transfer
app.post('/transfer', async (req, res) => {
    const { recipientEmail, amount } = req.body;
    const tAmt = parseFloat(amount);
    const sender = await User.findById(req.session.userId);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) return res.send("Recipient not found.");
    if (tAmt > sender.balance) return res.send("Insufficient funds.");
    
    sender.balance -= tAmt;
    sender.transactions.push({ type: 'Transfer Out', amount: tAmt });
    recipient.balance += tAmt;
    recipient.transactions.push({ type: 'Transfer In', amount: tAmt });

    await sender.save();
    await recipient.save();
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// --- STARTUP ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("Server Live"));
}).catch(err => console.log(err));
