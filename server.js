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
        balance: 120, // Starting balance from your example
        agtTokens: 100,
        lockedBonus: 20,
        bonusUnlockDate: new Date("2026-02-01"),
        isAdmin: false,
        transactions: [
            { type: "Deposit", amount: 100, date: "1/1/2026" },
            { type: "20% Bonus", amount: 20, date: "1/1/2026" }
        ],
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
        .box{background:#1c2026;padding:40px;border-radius:24px;text-align:center;width:100%;max-width:350px;box-shadow:0 20px 50px rgba(0,0,0,0.5)}
        input{width:100%;padding:16px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:12px;box-sizing:border-box;font-size:16px}
        button{width:100%;padding:16px;background:linear-gradient(135deg, #f0b90b, #d9a300);border:none;font-weight:bold;border-radius:12px;cursor:pointer;margin-top:15px;color:#000;font-size:16px}
        </style></head><body><div class="box"><h2 style="color:#f0b90b;margin-bottom:10px">BlezzyPay</h2><p style="color:#666;font-size:14px;margin-bottom:30px">Secure Finance Portal</p><form action="/login" method="POST">
        <input type="email" name="email" placeholder="Email" required><input type="password" name="passcode" placeholder="Passcode" required>
        <button>SECURE LOGIN</button></form></div></body></html>
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

// --- 4. MODERN DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (user.isAdmin) return res.redirect('/admin');

    let bonusStatus = user.bonusUnlockDate && new Date() >= user.bonusUnlockDate ? "Unlocked" : "Locked (30 Days)";

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>BlezzyPay Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --primary: #f0b90b; --bg: #0f1216; --card: #1c2026; --text-muted: #888; }
            body{background:var(--bg);color:white;font-family:'Inter',sans-serif;margin:0;padding-bottom:100px}
            
            /* Ticker & Logos */
            .ticker-wrap{width:100%;overflow:hidden;background:#16191f;border-bottom:1px solid #222;padding:10px 0}
            .ticker{display:flex;white-space:nowrap;animation:ticker 30s linear infinite}
            .ticker-item{padding:0 30px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px}
            .up{color:#00c853} .down{color:#ff3d00}
            @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
            
            .partners-strip { background: #000; padding: 15px 0; overflow: hidden; border-bottom:1px solid #222; }
            .logo-slider { display: flex; width: 200%; animation: scroll 40s linear infinite; align-items: center; }
            .logo-track { display: flex; align-items: center; justify-content: space-around; width: 50%; }
            .partner-logo { height: 24px; margin: 0 25px; opacity: 0.5; filter: grayscale(100%); transition: 0.3s; }
            .partner-logo:hover { opacity: 1; filter: grayscale(0%); }
            @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

            /* Main Layout */
            .container { padding: 24px; max-width: 480px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .user-info h1 { margin: 0; font-size: 20px; }
            .user-info p { margin: 0; font-size: 12px; color: var(--text-muted); }
            .logout-btn { color: #ff4757; text-decoration: none; font-size: 13px; font-weight: 600; background: rgba(255, 71, 87, 0.1); padding: 8px 16px; border-radius: 20px; }

            /* Portfolio Card */
            .portfolio-card { background: linear-gradient(135deg, #2b323b 0%, #1c2026 100%); border-radius: 24px; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); }
            .portfolio-label { font-size: 13px; color: #aaa; margin-bottom: 5px; }
            .portfolio-value { font-size: 38px; font-weight: 700; color: #fff; letter-spacing: -1px; }
            .agt-tag { position: absolute; top: 25px; right: 25px; background: rgba(240, 185, 11, 0.2); color: var(--primary); padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }

            /* Action Buttons */
            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
            .btn-action { border: none; padding: 18px; border-radius: 18px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
            .btn-deposit { background: var(--primary); color: #000; box-shadow: 0 4px 15px rgba(240, 185, 11, 0.3); }
            .btn-withdraw { background: #2c333e; color: #fff; border: 1px solid #3a424e; }
            .btn-withdraw:hover { background: #3a424e; }

            /* Bonus Card */
            .bonus-card { background: rgba(0, 200, 83, 0.1); border: 1px solid rgba(0, 200, 83, 0.3); border-radius: 20px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .bonus-info div:first-child { color: #00c853; font-weight: 700; font-size: 18px; }
            .bonus-info div:last-child { color: #888; font-size: 12px; margin-top: 2px; }
            .status-badge { background: #00c853; color: #000; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }

            /* History */
            .section-title { font-size: 16px; font-weight: 600; margin-bottom: 15px; }
            .tx-list { display: flex; flex-direction: column; gap: 12px; }
            .tx-item { display: flex; justify-content: space-between; align-items: center; background: #181b21; padding: 16px; border-radius: 16px; }
            .tx-left { display: flex; gap: 12px; align-items: center; }
            .tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
            .icon-dep { background: rgba(0, 200, 83, 0.15); color: #00c853; }
            .icon-with { background: rgba(255, 61, 0, 0.15); color: #ff3d00; }
            .icon-bonus { background: rgba(240, 185, 11, 0.15); color: var(--primary); }
            .tx-details div:first-child { font-weight: 600; font-size: 14px; }
            .tx-details div:last-child { font-size: 11px; color: #666; margin-top: 2px; }
            .tx-amount { font-weight: 700; font-size: 14px; }
            .pos { color: #00c853; } .neg { color: #fff; }

            /* Modal */
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; align-items: flex-end; justify-content: center; backdrop-filter: blur(5px); }
            .modal-content { background: #1c2026; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 30px; animation: slideUp 0.3s ease; }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            .modal h2 { margin-top: 0; font-size: 20px; }
            .inp-group { margin-bottom: 15px; }
            .inp-group label { display: block; font-size: 12px; color: #888; margin-bottom: 8px; }
            .inp-field { width: 100%; padding: 16px; background: #0f1216; border: 1px solid #333; color: white; border-radius: 12px; font-size: 16px; outline: none; }
            .btn-full { width: 100%; padding: 18px; background: var(--primary); color: black; font-weight: bold; border-radius: 12px; border: none; cursor: pointer; font-size: 16px; }
            .close-modal { position: absolute; top: 20px; right: 20px; font-size: 24px; color: #888; cursor: pointer; }

            .wa-float { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-decoration: none; z-index: 100; transition: transform 0.2s;}
            .wa-float:hover { transform: scale(1.1); }
        </style></head><body>

        <div class="ticker-wrap"><div class="ticker">
            <div class="ticker-item">BTC <span class="up">$98,420</span></div>
            <div class="ticker-item">ETH <span class="down">$3,150</span></div>
            <div class="ticker-item">XRP <span class="up">$1.12</span></div>
            <div class="ticker-item">SOL <span class="up">$145.20</span></div>
            <div class="ticker-item">USDT <span class="up">$1.00</span></div>
            <div class="ticker-item">BTC <span class="up">$98,420</span></div>
            <div class="ticker-item">ETH <span class="down">$3,150</span></div>
            <div class="ticker-item">XRP <span class="up">$1.12</span></div>
        </div></div>

        <div class="partners-strip"><div class="logo-slider">
            <div class="logo-track">
                <img src="https://logo.clearbit.com/goldmansachs.com" class="partner-logo">
                <img src="https://logo.clearbit.com/jpmorganchase.com" class="partner-logo">
                <img src="https://logo.clearbit.com/bnymellon.com" class="partner-logo">
                <img src="https://logo.clearbit.com/coinbase.com" class="partner-logo">
                <img src="https://logo.clearbit.com/revolut.com" class="partner-logo">
                <span style="font-size:10px; color:#555; font-weight:bold; margin:0 15px;">BANCO MOZ</span>
            </div>
            <div class="logo-track">
                <img src="https://logo.clearbit.com/goldmansachs.com" class="partner-logo">
                <img src="https://logo.clearbit.com/jpmorganchase.com" class="partner-logo">
                <img src="https://logo.clearbit.com/bnymellon.com" class="partner-logo">
                <img src="https://logo.clearbit.com/coinbase.com" class="partner-logo">
                <img src="https://logo.clearbit.com/revolut.com" class="partner-logo">
                <span style="font-size:10px; color:#555; font-weight:bold; margin:0 15px;">BANCO MOZ</span>
            </div>
        </div></div>

        <div class="container">
            <div class="header">
                <div class="user-info">
                    <h1>Hello, User</h1>
                    <p>Welcome back</p>
                </div>
                <a href="/logout" class="logout-btn"><i class="fa-solid fa-power-off"></i> Logout</a>
            </div>

            ${user.pendingDeposit ? `<div style="background:#e67e22;padding:15px;border-radius:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:13px;font-weight:600">Pending Deposit: $${user.pendingDeposit.amount}</div>
                <a href="/pay-now" style="background:white;color:#e67e22;padding:8px 12px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:bold">PAY NOW</a>
            </div>` : ''}

            <div class="portfolio-card">
                <div class="portfolio-label">Total Portfolio Value</div>
                <div class="portfolio-value">$${(user.balance + user.lockedBonus).toFixed(2)}</div>
                <div class="agt-tag"><i class="fa-solid fa-coins"></i> ${user.agtTokens} AGT</div>
            </div>

            <div class="actions">
                <button class="btn-action btn-deposit" onclick="openModal('deposit')">
                    <i class="fa-solid fa-arrow-down"></i> DEPOSIT
                </button>
                <button class="btn-action btn-withdraw" onclick="openModal('withdraw')">
                    <i class="fa-solid fa-paper-plane"></i> WITHDRAW
                </button>
            </div>

            <div class="bonus-card">
                <div class="bonus-info">
                    <div>$${user.lockedBonus.toFixed(2)}</div>
                    <div>Locked Bonus (20%)</div>
                </div>
                <div class="status-badge">${bonusStatus}</div>
            </div>

            <div class="section-title">Recent Activity</div>
            <div class="tx-list">
                ${user.transactions.slice().reverse().map(t => {
                    let icon = "icon-dep"; let fa = "fa-arrow-down"; let sign = "+"; let col = "pos";
                    if(t.type.includes("Withdraw")) { icon = "icon-with"; fa = "fa-arrow-up"; sign = "-"; col = "neg"; }
                    if(t.type.includes("Bonus")) { icon = "icon-bonus"; fa = "fa-lock"; }
                    
                    return `
                    <div class="tx-item">
                        <div class="tx-left">
                            <div class="tx-icon ${icon}"><i class="fa-solid ${fa}"></i></div>
                            <div class="tx-details">
                                <div>${t.type}</div>
                                <div>${t.date}</div>
                            </div>
                        </div>
                        <div class="tx-amount ${col}">${sign}$${t.amount}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div id="depositModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModals()">&times;</span>
                <h2>Deposit Funds</h2>
                <form action="/initiate-deposit" method="POST">
                    <div class="inp-group">
                        <label>Amount (USD)</label>
                        <input type="number" name="amount" class="inp-field" placeholder="e.g. 5000" required>
                    </div>
                    <button class="btn-full">PROCEED TO PAYMENT</button>
                </form>
            </div>
        </div>

        <div id="withdrawModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModals()">&times;</span>
                <h2>Withdraw Funds</h2>
                <div style="background:#2c333e; padding:15px; border-radius:12px; margin-bottom:20px; font-size:13px; color:#ccc;">
                    Available Balance: <strong style="color:white">$${user.balance.toFixed(2)}</strong>
                </div>
                <form action="/withdraw" method="POST">
                    <div class="inp-group">
                        <label>Withdraw Amount</label>
                        <input type="number" name="amount" class="inp-field" placeholder="0.00" required max="${user.balance}">
                    </div>
                    <div class="inp-group">
                        <label>Wallet Address / IBAN</label>
                        <input type="text" name="destination" class="inp-field" placeholder="Paste address here" required>
                    </div>
                    <button class="btn-full" style="background:#fff; color:black">CONFIRM WITHDRAWAL</button>
                </form>
            </div>
        </div>

        <a href="https://wa.me/46704406175" class="wa-float" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>

        <script>
            function openModal(type) {
                document.getElementById(type + 'Modal').style.display = 'flex';
            }
            function closeModals() {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            }
            window.onclick = function(event) {
                if (event.target.classList.contains('modal')) closeModals();
            }
        </script>
    </body></html>`);
});

// --- 5. FUNCTIONAL ROUTES ---

// Deposit
app.post('/initiate-deposit', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    const amount = parseFloat(req.body.amount);
    user.pendingDeposit = { amount: amount, status: "Waiting", date: new Date() };
    res.redirect('/pay-now');
});

// Withdraw (New Feature)
app.post('/withdraw', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    const amount = parseFloat(req.body.amount);
    
    if (amount > 0 && user.balance >= amount) {
        user.balance -= amount;
        user.transactions.push({ type: "Withdrawal (Pending)", amount: amount, date: new Date().toLocaleDateString() });
        // In a real app, you would save the 'destination' address for admin review
    }
    res.redirect('/dashboard');
});

// Pay Page (Refined)
app.get('/pay-now', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (!user.pendingDeposit) return res.redirect('/dashboard');

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{background:#0f1216;color:white;font-family:sans-serif;padding:20px}
        .box{background:#1c2026;padding:15px;border-radius:12px;margin-bottom:10px;border:1px solid #333;font-size:14px}
        .hl{color:#f0b90b;font-weight:bold;display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:1px}
        .val{font-family:monospace;font-size:13px;color:#ddd}
        h1{color:#f0b90b;text-align:center}</style></head><body>
        <div style="max-width:500px;margin:0 auto">
            <p style="text-align:center;color:#888;margin:0">Sending Amount</p>
            <h1>$${user.pendingDeposit.amount}</h1>
            
            <div class="box"><span class="hl">US Bank</span><span class="val">Bank of America | 026009593</span></div>
            <div class="box"><span class="hl">EU Bank</span><span class="val">Barclay | GB33BARC20658259151311 | Ref: infogloirebanco</span></div>
            <div class="box"><span class="hl">Uganda</span><span class="val">Equity Bank | 1003103498481 | Ref: Annet</span></div>
            <div class="box"><span class="hl">South Africa</span><span class="val">Capitek | 1882242481 | Ref: BlezzyPay</span></div>
            <div class="box"><span class="hl">Bitcoin</span><span class="val">bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</span></div>

            <form action="/confirm-payment-sent" method="POST">
                <button style="width:100%;padding:15px;background:#00c853;color:white;border:none;border-radius:10px;font-weight:bold;margin-top:20px">CONFIRM PAYMENT SENT</button>
            </form>
            <div style="text-align:center;margin-top:20px"><a href="/cancel-deposit" style="color:#ff4757;text-decoration:none">Cancel</a></div>
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
                        <button style="background:green;color:white;padding:10px;cursor:pointer">CONFIRM</button>
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
        u.balance += amt; u.agtTokens += amt; u.lockedBonus += bonus;
        let unlock = new Date(); unlock.setDate(unlock.getDate() + 30); u.bonusUnlockDate = unlock;
        u.transactions.push({ type: "Deposit", amount: amt, date: new Date().toLocaleDateString() });
        u.transactions.push({ type: "20% Bonus", amount: bonus, date: new Date().toLocaleDateString() });
        u.pendingDeposit = null;
    }
    res.redirect('/admin');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
