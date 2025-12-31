const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'finance_secret', 
    resave: false, 
    saveUninitialized: true 
}));

// --- THE USER SCHEMA (Keep this inside server.js) ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    transactions: [{
        type: { type: String }, // "Deposit" or "Withdraw"
        amount: Number,
        date: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', UserSchema);

// --- ROUTES ---

// 1. Home / Login Page
app.get('/', (req, res) => {
    res.send(`
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; }
            .login-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            input { display: block; width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
        <div class="login-card">
            <h2>Finance App Login</h2>
            <form action="/login" method="POST">
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Enter Dashboard</button>
            </form>
        </div>
    `);
});

// 2. Login Logic
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
    } else { res.send("Wrong password. <a href='/'>Try again</a>"); }
});

// 3. Dashboard (The Professional View)
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);

    res.send(`
        <style>
            body { font-family: sans-serif; background: #f4f7f6; padding: 20px; }
            .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
            .balance-box { background: #2ecc71; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .balance-amount { font-size: 32px; font-weight: bold; }
            .actions { display: flex; gap: 10px; margin-bottom: 20px; }
            input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
            .btn { padding: 10px 20px; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; }
            .btn-dep { background: #27ae60; }
            .btn-wit { background: #e74c3c; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
        </style>

        <div class="card">
            <h2>Welcome, ${user.email}</h2>
            <div class="balance-box">
                <p>Available Balance</p>
                <div class="balance-amount">$${user.balance.toFixed(2)}</div>
            </div>

            <div class="actions">
                <form action="/deposit" method="POST" style="display:flex; width:100%; gap:5px;">
                    <input type="number" name="amount" placeholder="Amount to Deposit" step="0.01" required>
                    <button type="submit" class="btn btn-dep">Deposit</button>
                </form>
            </div>
            <div class="actions">
                <form action="/withdraw" method="POST" style="display:flex; width:100%; gap:5px;">
                    <input type="number" name="amount" placeholder="Amount to Withdraw" step="0.01" required>
                    <button type="submit" class="btn btn-wit">Withdraw</button>
                </form>
            </div>

            <h3>Recent Transactions</h3>
            <table>
                <tr><th>Type</th><th>Amount</th><th>Date</th></tr>
                ${user.transactions.slice().reverse().map(t => `
                    <tr>
                        <td style="color: ${t.type === 'Deposit' ? 'green' : 'red'}"><strong>${t.type}</strong></td>
                        <td>$${t.amount.toFixed(2)}</td>
                        <td>${new Date(t.date).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </table>
            <p style="margin-top:20px;"><a href="/logout">Logout</a></p>
        </div>
    `);
});

// 4. Deposit Logic
app.post('/deposit', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (amount <= 0) return res.send("Invalid amount");
    const user = await User.findById(req.session.userId);
    user.balance += amount;
    user.transactions.push({ type: 'Deposit', amount: amount });
    await user.save();
    res.redirect('/dashboard');
});

// 5. Withdraw Logic
app.post('/withdraw', async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const user = await User.findById(req.session.userId);
    if (amount > user.balance) return res.send("Insufficient funds");
    user.balance -= amount;
    user.transactions.push({ type: 'Withdraw', amount: amount });
    await user.save();
    res.redirect('/dashboard');
});

// 6. Logout
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// --- START SERVER ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT || 3000, () => console.log("Server Live"));
    })
    .catch(err => console.log("DB Error: " + err));
