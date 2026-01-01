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
        
        // BALANCES
        balance: 0,          
        lockedCapital: 100,  
        accumulatedYield: 20,
        agtTokens: 100,
        
        isAdmin: false,
        transactions: [
            { type: "Smart Vault Deposit", amount: 100, date: "1/1/2026" },
            { type: "Monthly Yield (20%)", amount: 20, date: "1/1/2026" }
        ],
        pendingDeposit: null
    }
];

// Helpers
const findUser = (id) => users.find(u => u.id === id);
const findUserByEmail = (email) => users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());

// --- 3. LOGIN PAGE ---
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

// --- 4. DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (user.isAdmin) return res.redirect('/admin');

    const totalPortfolio = user.balance + user.lockedCapital + user.accumulatedYield;

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>BlezzyPay Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --primary: #f0b90b; --bg: #0f1216; --card: #1c2026; }
            body{background:var(--bg);color:white;font-family:'Inter',sans-serif;margin:0;padding-bottom:50px}
            
            /* Ticker */
            .ticker-wrap{width:100%;overflow:hidden;background:#16191f;border-bottom:1px solid #222;padding:10px 0}
            .ticker{display:flex;white-space:nowrap;animation:ticker 30s linear infinite}
            .ticker-item{padding:0 30px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px}
            .up{color:#00c853} .down{color:#ff3d00}
            @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}

            /* Layout */
            .container { padding: 24px; max-width: 480px; margin: 0 auto; min-height: 80vh; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .logout-btn { color: #ff4757; text-decoration: none; font-size: 13px; font-weight: 600; background: rgba(255, 71, 87, 0.1); padding: 8px 16px; border-radius: 20px; }

            /* Portfolio */
            .portfolio-card { background: linear-gradient(135deg, #2b323b 0%, #1c2026 100%); border-radius: 24px; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); }
            .portfolio-label { font-size: 13px; color: #aaa; margin-bottom: 5px; }
            .portfolio-value { font-size: 38px; font-weight: 700; color: #fff; letter-spacing: -1px; }
            .agt-tag { position: absolute; top: 25px; right: 25px; background: rgba(240, 185, 11, 0.2); color: var(--primary); padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }

            /* Actions */
            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
            .btn-action { border: none; padding: 18px; border-radius: 18px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
            .btn-deposit { background: var(--primary); color: #000; box-shadow: 0 4px 15px rgba(240, 185, 11, 0.3); }
            .btn-withdraw { background: #2c333e; color: #fff; border: 1px solid #3a424e; }

            /* Stats Grid */
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #1c2026; padding: 15px; border-radius: 16px; border: 1px solid #333; }
            .stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
            .stat-val { font-size: 18px; font-weight: 700; color: #fff; }
            .green-text { color: #00c853; }

            /* History */
            .tx-list { display: flex; flex-direction: column; gap: 12px; }
            .tx-item { display: flex; justify-content: space-between; align-items: center; background: #181b21; padding: 16px; border-radius: 16px; }
            .tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 12px; }
            .icon-dep { background: rgba(0, 200, 83, 0.15); color: #00c853; }
            .icon-lock { background: rgba(240, 185, 11, 0.15); color: var(--primary); }
            .icon-with { background: rgba(255, 61, 0, 0.15); color: #ff3d00; }
            .tx-details div:first-child { font-weight: 600; font-size: 14px; }
            .tx-details div:last-child { font-size: 11px; color: #666; margin-top: 2px; }

            /* Footer Partners */
            .footer-partners { margin-top: 50px; padding-top: 20px; border-top: 1px solid #222; overflow: hidden; }
            .fp-header { text-align: center; color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; font-weight: 600; }
            .logo-slider { display: flex; width: 200%; animation: scroll 45s linear infinite; }
            .logo-track { display: flex; align-items: center; justify-content: space-around; width: 50%; }
            .partner-item { text-decoration: none; display: flex; align-items: center; }
            .partner-logo { height: 35px; margin: 0 30px; opacity: 0.5; filter: grayscale(100%) brightness(1.5); transition: 0.3s; }
            .partner-logo:hover { opacity: 1; filter: grayscale(0%) brightness(1); transform: scale(1.1); }
            .text-logo { font-size: 11px; color: #777; font-weight: bold; margin: 0 20px; text-decoration: none; white-space: nowrap; border: 1px solid #333; padding: 5px 10px; border-radius: 5px; transition: 0.3s; }
            .text-logo:hover { color: #fff; border-color: #777; }
            
            @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

            /* Modals & Float */
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; align-items: flex-end; justify-content: center; backdrop-filter: blur(5px); }
            .modal-content { background: #1c2026; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 30px; animation: slideUp 0.3s ease; }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            .inp-field { width: 100%; padding: 16px; background: #0f1216; border: 1px solid #333; color: white; border-radius: 12px; font-size: 16px; outline: none; margin-bottom: 15px; }
            .btn-full { width: 100%; padding: 18px; background: var(--primary); color: black; font-weight: bold; border-radius: 12px; border: none; cursor: pointer; font-size: 16px; }
            .close-modal { float:right; font-size: 24px; cursor: pointer; color: #666; }
            .wa-float { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-decoration: none; z-index: 100; transition: transform 0.2s;}
            .wa-float:hover { transform: scale(1.1); }
        </style></head><body>

        <div class="ticker-wrap"><div class="ticker">
            <div class="ticker-item">BTC <span class="up">$98,420</span></div>
            <div class="ticker-item">ETH <span class="down">$3,150</span></div>
            <div class="ticker-item">XRP <span class="up">$1.12</span></div>
            <div class="ticker-item">USDT <span class="up">$1.00</span></div>
            <div class="ticker-item">BTC <span class="up">$98,420</span></div>
            <div class="ticker-item">ETH <span class="down">$3,150</span></div>
        </div></div>

        <div class="container">
            <div class="header">
                <div><h1 style="margin:0;font-size:20px">Hello, User</h1><p style="margin:0;font-size:12px;color:#888">BlezzyPay Premier</p></div>
                <a href="/logout" class="logout-btn"><i class="fa-solid fa-power-off"></i> Logout</a>
            </div>

            ${user.pendingDeposit ? `<div style="background:#e67e22;padding:15px;border-radius:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:13px;font-weight:600">Pending: $${user.pendingDeposit.amount}</div>
                <a href="/pay-now" style="background:white;color:#e67e22;padding:8px 12px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:bold">PAY</a>
            </div>` : ''}

            <div class="portfolio-card">
                <div class="portfolio-label">Total Asset Value</div>
                <div class="portfolio-value">$${totalPortfolio.toFixed(2)}</div>
                <div class="agt-tag"><i class="fa-solid fa-coins"></i> ${user.agtTokens} AGT</div>
            </div>

            <div class="actions">
                <button class="btn-action btn-deposit" onclick="openModal('deposit')"><i class="fa-solid fa-arrow-down"></i> DEPOSIT</button>
                <button class="btn-action btn-withdraw" onclick="openModal('withdraw')"><i class="fa-solid fa-paper-plane"></i> WITHDRAW</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label"><i class="fa-solid fa-lock"></i> Locked Capital</div>
                    <div class="stat-val">$${user.lockedCapital.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label"><i class="fa-solid fa-chart-line"></i> Yield (20%)</div>
                    <div class="stat-val green-text">+$${user.accumulatedYield.toFixed(2)}</div>
                </div>
            </div>

            <div class="section-title">Smart History</div>
            <div class="tx-list">
                ${user.transactions.slice().reverse().map(t => {
                    let icon = "icon-dep"; let fa = "fa-arrow-down"; let col = "green-text";
                    if(t.type.includes("Withdraw")) { icon = "icon-with"; fa = "fa-arrow-up"; col = "white"; }
                    if(t.type.includes("Yield") || t.type.includes("Bonus")) { icon = "icon-lock"; fa = "fa-percentage"; }
                    
                    return `
                    <div class="tx-item">
                        <div style="display:flex;align-items:center;">
                            <div class="tx-icon ${icon}"><i class="fa-solid ${fa}"></i></div>
                            <div class="tx-details"><div>${t.type}</div><div>${t.date}</div></div>
                        </div>
                        <div class="tx-amount ${col}">+$${t.amount}</div>
                    </div>`;
                }).join('')}
            </div>

            <div class="footer-partners">
                <div class="fp-header">Trusted by Global Leaders</div>
                <div class="logo-slider">
                    <div class="logo-track">
                        <a href="https://www.goldmansachs.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Goldman_Sachs.svg" class="partner-logo" title="Goldman Sachs">
                        </a>
                        <a href="https://www.jpmorganchase.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/JPMorgan_Chase_logo_2008.svg" class="partner-logo" title="JPMorgan">
                        </a>
                        <a href="https://www.bnymellon.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f4/BNY_Mellon_logo.svg" class="partner-logo" title="BNY Mellon">
                        </a>
                        <a href="https://www.coinbase.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg" class="partner-logo" title="Coinbase">
                        </a>
                        <a href="https://www.fidelity.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Fidelity_Investments.svg" class="partner-logo" title="Fidelity">
                        </a>
                        <a href="https://www.revolut.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/62/Revolut_logo.svg" class="partner-logo" title="Revolut">
                        </a>
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-logo">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-logo">ARMONIE BANK SA</a>
                    </div>
                    
                    <div class="logo-track">
                        <a href="https://www.goldmansachs.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Goldman_Sachs.svg" class="partner-logo">
                        </a>
                        <a href="https://www.jpmorganchase.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/JPMorgan_Chase_logo_2008.svg" class="partner-logo">
                        </a>
                        <a href="https://www.bnymellon.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f4/BNY_Mellon_logo.svg" class="partner-logo">
                        </a>
                        <a href="https://www.coinbase.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Coinbase.svg" class="partner-logo">
                        </a>
                        <a href="https://www.fidelity.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Fidelity_Investments.svg" class="partner-logo">
                        </a>
                        <a href="https://www.revolut.com" target="_blank" class="partner-item">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/62/Revolut_logo.svg" class="partner-logo">
                        </a>
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-logo">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-logo">ARMONIE BANK SA</a>
                    </div>
                </div>
            </div>
        </div>

        <div id="depositModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModals()">&times;</span>
                <h2>Deposit to Smart Vault</h2>
                <p style="font-size:12px;color:#888;margin-bottom:20px">Deposits are locked. You earn 20% monthly yield.</p>
                <form action="/initiate-deposit" method="POST">
                    <input type="number" name="amount" class="inp-field" placeholder="Amount (USD)" required>
                    <button class="btn-full">PROCEED</button>
                </form>
            </div>
        </div>

        <div id="withdrawModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModals()">&times;</span>
                <h2>Withdraw Profits</h2>
                <div style="background:#2c333e; padding:15px; border-radius:12px; margin-bottom:20px; font-size:13px; color:#ccc;">
                    Available (Unlocked): <strong style="color:white">$${user.balance.toFixed(2)}</strong>
                </div>
                <form action="/withdraw" method="POST">
                    <input type="number" name="amount" class="inp-field" placeholder="Amount" required max="${user.balance}">
                    <input type="text" name="destination" class="inp-field" placeholder="Wallet Address" required>
                    <button class="btn-full" style="background:#fff; color:black">REQUEST WITHDRAWAL</button>
                </form>
            </div>
        </div>

        <a href="https://wa.me/46704406175" class="wa-float" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>
        <script>
            function openModal(type) { document.getElementById(type + 'Modal').style.display = 'flex'; }
            function closeModals() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
            window.onclick = function(e) { if (e.target.classList.contains('modal')) closeModals(); }
        </script>
    </body></html>`);
});

// --- 5. FUNCTIONAL ROUTES ---

app.post('/initiate-deposit', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    user.pendingDeposit = { amount: parseFloat(req.body.amount), status: "Waiting", date: new Date() };
    res.redirect('/pay-now');
});

app.post('/withdraw', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    const amount = parseFloat(req.body.amount);
    if (amount > 0 && user.balance >= amount) {
        user.balance -= amount;
        user.transactions.push({ type: "Withdrawal Request", amount: amount, date: new Date().toLocaleDateString() });
    }
    res.redirect('/dashboard');
});

app.get('/pay-now', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (!user.pendingDeposit) return res.redirect('/dashboard');
    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{background:#0f1216;color:white;font-family:sans-serif;padding:20px}
        .box{background:#1c2026;padding:15px;border-radius:12px;margin-bottom:10px;border:1px solid #333;font-size:14px}
        .hl{color:#f0b90b;font-weight:bold;display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase}
        h1{color:#f0b90b;text-align:center}</style></head><body>
        <div style="max-width:500px;margin:0 auto">
            <h1 style="text-align:center">$${user.pendingDeposit.amount}</h1>
            <div class="box"><span class="hl">US Bank</span>Bank of America | 026009593</div>
            <div class="box"><span class="hl">EU Bank</span>Barclay | GB33BARC20658259151311 | Ref: infogloirebanco</div>
            <div class="box"><span class="hl">Uganda</span>Equity Bank | 1003103498481 | Ref: Annet</div>
            <div class="box"><span class="hl">South Africa</span>Capitek | 1882242481 | Ref: BlezzyPay</div>
            <div class="box"><span class="hl">Bitcoin</span>bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</div>
            <form action="/confirm-payment-sent" method="POST">
                <button style="width:100%;padding:15px;background:#00c853;color:white;border:none;border-radius:10px;font-weight:bold;margin-top:20px">I SENT PAYMENT</button>
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

// --- 6. ADMIN PANEL ---
app.get('/admin', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.send("Access Denied");
    const pending = users.filter(u => u.pendingDeposit && u.pendingDeposit.status === "Pending Admin");

    res.send(`
        <body style="font-family:sans-serif;padding:20px;background:#eee">
            <h1>Admin Panel</h1>
            
            <div style="margin-bottom:20px; padding:15px; background:white; border-left:5px solid #000;">
                <h3>Controls</h3>
                <form action="/admin/trigger-yield" method="POST">
                    <button style="background:black; color:#f0b90b; padding:10px 20px; border:none; cursor:pointer; font-weight:bold;">⚡ TRIGGER MONTHLY YIELD (20%)</button>
                    <small style="display:block; margin-top:5px; color:#666;">Clicking this pays 20% to all users based on their Locked Capital.</small>
                </form>
            </div>

            <h3>Pending Deposits</h3>
            ${pending.length === 0 ? "No pending deposits." : ""}
            ${pending.map(u => `
                <div style="background:white;padding:20px;margin-bottom:10px;border-left:5px solid #f0b90b">
                    User: ${u.email} claims <strong>$${u.pendingDeposit.amount}</strong>
                    <form action="/admin/confirm" method="POST" style="margin-top:10px">
                        <input type="hidden" name="uid" value="${u.id}">
                        <button style="background:green;color:white;border:none;padding:10px">CONFIRM DEPOSIT</button>
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
        // Logic: Deposit goes to LOCKED CAPITAL
        u.lockedCapital += amt;
        u.agtTokens += amt;
        
        u.transactions.push({ type: "Smart Vault Deposit", amount: amt, date: new Date().toLocaleDateString() });
        u.pendingDeposit = null;

        // Generate PDF Receipt
        const doc = new PDFDocument();
        console.log(`Sending Receipt to ${u.email}`);
        doc.text(`Confirmed Deposit: $${amt} into Smart Vault.`);
        doc.end();
    }
    res.redirect('/admin');
});

// Admin Monthly Trigger
app.post('/admin/trigger-yield', (req, res) => {
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.redirect('/');
    
    users.forEach(u => {
        if(!u.isAdmin && u.lockedCapital > 0) {
            const yieldAmt = u.lockedCapital * 0.20;
            u.accumulatedYield += yieldAmt;
            // Also add to available balance so they can withdraw the profit if they want? 
            // Or keep it in accumulated yield? The prompt implied earning it. 
            // Let's add it to 'accumulatedYield' which adds to Total Portfolio.
            u.transactions.push({ type: "Monthly Yield (20%)", amount: yieldAmt, date: new Date().toLocaleDateString() });
        }
    });
    res.redirect('/admin');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
