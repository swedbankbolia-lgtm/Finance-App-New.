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

// --- DATABASE USER SCHEMA ---
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
    unlockDate: { type: Date }
});
const User = mongoose.model('User', UserSchema);

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send(`<h2>Login / Register</h2>
        <form action="/login" method="POST">
            <input type="email" name="email" placeholder="Email" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Enter App</button>
        </form>`);
});

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
    } else { res.send("Wrong password."); }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = await User.findById(req.session.userId);
    res.send(`<h1>Dashboard</h1><p>User: ${user.email}</p><p>Balance: $${user.balance}</p><p>Locked Bonus: $${user.lockedBalance}</p><a href="/logout">Logout</a>`);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// --- CONNECT & START ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("SUCCESS: Connected to MongoDB");
        app.listen(process.env.PORT || 3000, () => console.log("Server Live"));
    })
    .catch(err => console.log("DB Error: " + err));
