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

// --- 2. MOCK DATABASE ---
const users = [
    {
        id: "admin_1",
        email: "admin@test.com",
        passcode: "1234", // ADMIN PASSCODE
        isAdmin: true,
        transactions: []
    },
    {
        id: "user_1",
        email: "user@test.com",
        passcode: "1111", // USER PASSCODE
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
const findUserByEmail = (email) => users.find(u => u.email === email);

// --- 3. AUTH ROUTES ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>BlezzyPay Login</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>
                body { background: #0f1216; color: white; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .login-box { background: #1c2026; padding: 40px; border-radius: 20px; text-align: center; width: 100%; max-width: 350px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                input { width: 100%; padding: 15px; margin: 10px 0; background: #0b0e11; border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; }
                button { width: 100%; padding: 15px; background: #f0b90b; border: none; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 10px; }
                .note { margin-top:20px; font-size:11px; color:#444; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2 style="color:#f0b90b;">BlezzyPay</h2>
                <p style="color:#888; font-size:13px;">Secure Finance Portal</p>
                <form action="/login" method="POST">
                    <input type="email" name="email" placeholder="Email" required>
                    <input type="password" name="passcode" placeholder="Passcode" required>
                    <button type="submit">LOGIN</button>
                </form>
                <div class="note">
                    <strong>User:</strong> user@test.com / 1111 <br>
                    <strong>Admin:</strong> admin@test.com / 1234
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const email = req.body.email.trim();
    const passcode = req.body.passcode.trim();
    const user = findUserByEmail(email);
    
    if (user && user.passcode === passcode) {
        req.session.userId = user.id;
        if(user.isAdmin) return res.redirect('/admin');
        return res.redirect('/dashboard');
    }
    res.send(`<body style="background:#0f1216; color:white; text-align:center; padding-top:50px; font-family:sans-serif;">
        <h3>Invalid Credentials</h3>
        <p>You typed: ${email} / ${passcode}</p>
        <a href="/" style="color:#f0b90b;">Try Again</a>
    </body>`);
});

// --- 4. USER DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (user.isAdmin) return res.redirect('/admin');

    let bonusStatus = "Locked (30 Days)";
    if (user.bonusUnlockDate && new Date() >= user.bonusUnlockDate) {
        bonusStatus = "Unlocked - Ready to Use";
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>My Wallet</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { background: #0f1216; color: white; font-family: 'Inter', sans-serif; margin: 0; padding-bottom: 80px; }
                
                /* Ticker Styles */
                .ticker-wrap { width: 100%; overflow: hidden; background: #1e2329; color: #f0b90b; padding: 12px 0; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 50; }
                .ticker { display: flex; white-space: nowrap; animation: ticker 30s linear infinite; }
                .ticker-item { padding: 0 30px; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
                .price-up { color: #4caf50; }
                .price-down { color: #f44336; }
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }

                /* Partners Section */
                .partners-section { background: #0f1216; padding: 20px 0; border-bottom: 1px solid #333; overflow: hidden; }
                .partners-header { text-align: center; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; font-weight: 600; }
                .logo-slider { display: flex; width: 200%; animation: scrollLogos 40s linear infinite; }
                .logo-track { display: flex; align-items: center; justify-content: space-around; width: 50%; }
                .partner-logo { height: 30px; margin: 0 20px; opacity: 0.6; filter: grayscale(100%); transition: all 0.3s ease; object-fit: contain; }
                .partner-logo:hover { opacity: 1; filter: grayscale(0%); transform: scale(1.1); }
                @keyframes scrollLogos { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

                .content-area { padding: 20px; }
                .card { background: #1c2026; padding: 20px; border-radius: 20px; margin-bottom: 20px; position:relative; }
                .balance-header { font-size: 14px; color: #888; }
                .balance-amount { font-size: 36px; font-weight: bold; margin: 5px 0; }
                .badge { padding: 5px 10px; border-radius: 15px; font-size: 11px; background: #333; position:absolute; top:20px; right:20px; }
                .action-btn { background: #f0b90b; color:black; padding: 15px; border-radius: 15px; text-align: center; cursor: pointer; font-weight:bold; border:none; width:100%; }
                .pending-banner { background: #e67e22; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
                
                .wa-float { position: fixed; bottom: 20px; right: 20px; background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-decoration: none; z-index: 100; }
            </style>
        </head>
        <body>
            <div class="ticker-wrap">
                <div class="ticker">
                    <div class="ticker-item">ETH: <span id="eth-p" class="price-up">$...</span></div>
                    <div class="ticker-item">XRP: <span id="xrp-p" class="price-up">$...</span></div>
                    <div class="ticker-item">ETC: <span id="etc-p" class="price-up">$...</span></div>
                    <div class="ticker-item">USDT: <span id="usdt-p" class="price-up">$1.00</span></div>
                    <div class="ticker-item">USDC: <span id="usdc-p" class="price-up">$1.00</span></div>
                    <div class="ticker-item">ETH: <span id="eth-p2" class="price-up">$...</span></div>
                    <div class="ticker-item">XRP: <span id="xrp-p2" class="price-up">$...</span></div>
                </div>
            </div>

            <div class="partners-section">
                <div class="partners-header">Trusted by Global Financial Institutions</div>
                <div class="logo-slider">
                    <div class="logo-track">
                        <img src="https://logo.clearbit.com/goldmansachs.com" class="partner-logo" title="Goldman Sachs">
                        <img src="https://logo.clearbit.com/jpmorganchase.com" class="partner-logo" title="JP Morgan">
                        <img src="https://logo.clearbit.com/bnymellon.com" class="partner-logo" title="BNY Mellon">
                        <img src="https://logo.clearbit.com/fidelity.com" class="partner-logo" title="Fidelity">
                        <img src="https://logo.clearbit.com/getevolved.com" class="partner-logo" title="Evolve Bank">
                        <img src="https://logo.clearbit.com/coinbase.com" class="partner-logo" title="Coinbase">
                        <img src="https://logo.clearbit.com/marathondh.com" class="partner-logo" title="Marathon">
                        <img src="https://logo.clearbit.com/microstrategy.com" class="partner-logo" title="MicroStrategy">
                        <img src="https://logo.clearbit.com/bancomoc.mz" class="partner-logo" title="Banco de Moçambique">
                        <img src="https://logo.clearbit.com/revolut.com" class="partner-logo" title="Revolut">
                        <img src="https://logo.clearbit.com/investec.com" class="partner-logo" title="Investec">
                        <span style="font-size:10px; color:#666; font-weight:bold; margin:0 10px;">ARMONIE BANK SA</span>
                    </div>
                    <div class="logo-track">
                        <img src="https://logo.clearbit.com/goldmansachs.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/jpmorganchase.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/bnymellon.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/fidelity.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/getevolved.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/coinbase.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/marathondh.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/microstrategy.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/bancomoc.mz" class="partner-logo">
                        <img src="https://logo.clearbit.com/revolut.com" class="partner-logo">
                        <img src="https://logo.clearbit.com/investec.com" class="partner-logo">
                        <span style="font-size:10px; color:#666; font-weight:bold; margin:0 10px;">ARMONIE BANK SA</span>
                    </div>
                </div>
            </div>

            <div class="content-area">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <h3>Welcome</h3>
                    <a href="/logout" style="color:#f44336; text-decoration:none;">Logout</a>
                </div>

                ${user.pendingDeposit ? `
                    <div class="pending-banner">
                        <div>
                            <strong>Action Required:</strong> Pending deposit of $${user.pendingDeposit.amount}.
                        </div>
                        <a href="/pay-now" style="background:white; color:#e67e22; padding:5px 10px; border-radius:5px; text-decoration:none; font-weight:bold;">PAY NOW</a>
                    </div>
                ` : ''}

                <div class="card" style="background: linear-gradient(135deg, #1c2026 0%, #252a33 100%);">
                    <div class="balance-header">Total Portfolio Value</div>
                    <div class="balance-amount">$${(user.balance + user.lockedBonus).toFixed(2)}</div>
                    <div class="badge">AGT Tokens: ${user.agtTokens}</div>
                </div>

                <div class="card" style="background: #1a382e; border: 1px solid #2ecc71;">
                    <div class="balance-header" style="color:#a3e6c2;">30-Day Locked Bonus (20%)</div>
                    <div class="balance-amount">$${user.lockedBonus.toFixed(2)}</div>
                    <div style="font-size:12px; margin-top:5px; color:#a3e6c2;">Status: ${bonusStatus}</div>
                </div>

                <div class="card" style="padding: 15px;">
                    <form action="/initiate-deposit" method="POST" style="width:100%;">
                        <input type="number" name="amount" placeholder="Enter Deposit Amount ($)" required style="width:100%; padding:12px; border-radius:10px; border:1px solid #444; background:#000; color:white; margin-bottom:10px;">
                        <button class="action-btn">DEPOSIT & CLAIM 20%</button>
                    </form>
                </div>

                <h3>History</h3>
                ${user.transactions.length === 0 ? '<p style="color:#555;">No transactions yet.</p>' : ''}
                ${user.transactions.slice().reverse().map(t => `
                    <div style="padding:15px; border-bottom:1px solid #333; display:flex; justify-content:space-between;">
                        <div>${t.type} <br> <span style="font-size:11px; color:#888;">${t.date}</span></div>
                        <div style="color: #4caf50;">+$${t.amount}</div>
                    </div>
                `).join('')}
            </div>

            <a href="https://wa.me/46704406175" class="wa-float" target="_blank">
                <i class="fa-brands fa-whatsapp"></i>
            </a>

            <script>
                // --- LIVE PRICE SIMULATION ---
                function updatePrices() {
                    const prices = { eth: 3200, xrp: 1.10, etc: 26.50 };
                    function getFluctuation(base) {
                        return (base + (Math.random() * base * 0.02 - base * 0.01)).toFixed(2);
                    }
                    ['p', 'p2'].forEach(suffix => {
                        const eth = getFluctuation(prices.eth);
                        const xrp = getFluctuation(prices.xrp);
                        const etc = getFluctuation(prices.etc);
                        document.getElementById('eth-' + suffix).innerText = '$' + eth;
                        document.getElementById('xrp-' + suffix).innerText = '$' + xrp;
                        document.getElementById('etc-' + suffix).innerText = '$' + etc;
                        document.getElementById('eth-' + suffix).className = Math.random() > 0.5 ? 'price-up' : 'price-down';
                    });
                }
                updatePrices();
                setInterval(updatePrices, 3000);
            </script>
        </body>
        </html>
    `);
});

// --- 5. DEPOSIT & PAYMENT ROUTES ---

app.post('/initiate-deposit', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    const amount = parseFloat(req.body.amount);

    user.pendingDeposit = { amount: amount, status: "Waiting for Payment", date: new Date() };
    res.redirect('/pay-now');
});

app.get('/pay-now', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const user = findUser(req.session.userId);
    if (!user.pendingDeposit) return res.redirect('/dashboard');

    res.send(`
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { background: #0f1216; color: white; font-family: 'Inter', sans-serif; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; }
                .amount-box { text-align: center; margin-bottom: 20px; }
                .amount-box h1 { color: #f0b90b; font-size: 32px; margin: 0; }
                .pay-card { background: #1c2026; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #333; }
                .pay-title { color: #f0b90b; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
                .pay-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
                .pay-label { color: #888; }
                .pay-val { font-family: monospace; font-size: 14px; text-align: right; }
                .btn-sent { width: 100%; padding: 15px; background: #4caf50; color: white; border: none; font-weight: bold; border-radius: 10px; cursor: pointer; font-size: 16px; margin-top: 20px; }
                .wa-btn { display: block; width: 100%; padding: 15px; background: #25D366; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 10px; box-sizing: border-box; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="amount-box">
                    <p style="color:#888; margin:0;">You are depositing</p>
                    <h1>$${user.pendingDeposit.amount}</h1>
                </div>

                <div style="background:#e67e2220; border:1px solid #e67e22; color:#e67e22; padding:10px; border-radius:8px; margin-bottom:20px; font-size:12px; text-align:center;">
                    Please make a payment to <strong>ONE</strong> of the accounts below.
                </div>

                <div class="pay-card">
                    <div class="pay-title">🇺🇸 US Account</div>
                    <div class="pay-row"><span class="pay-label">Bank Name</span> <span class="pay-val">Bank of America</span></div>
                    <div class="pay-row"><span class="pay-label">Account</span> <span class="pay-val">026009593</span></div>
                </div>

                <div class="pay-card">
                    <div class="pay-title">🇪🇺 EU Account</div>
                    <div class="pay-row"><span class="pay-label">Bank Name</span> <span class="pay-val">Barclay</span></div>
                    <div class="pay-row"><span class="pay-label">Name</span> <span class="pay-val">Hillside (Sports) GP Limited</span></div>
                    <div class="pay-row"><span class="pay-label">Account</span> <span class="pay-val">GB33BARC20658259151311</span></div>
                    <div class="pay-row"><span class="pay-label">Reference</span> <span class="pay-val" style="color:#f0b90b;">infogloirebanco</span></div>
                </div>

                <div class="pay-card">
                    <div class="pay-title">🇺🇬 Uganda</div>
                    <div class="pay-row"><span class="pay-label">Bank Name</span> <span class="pay-val">Equity Bank</span></div>
                    <div class="pay-row"><span class="pay-label">Account</span> <span class="pay-val">1003103498481</span></div>
                    <div class="pay-row"><span class="pay-label">Reference</span> <span class="pay-val" style="color:#f0b90b;">Annet</span></div>
                </div>

                <div class="pay-card">
                    <div class="pay-title">🇿🇦 South Africa</div>
                    <div class="pay-row"><span class="pay-label">Bank Name</span> <span class="pay-val">Capitek Bank</span></div>
                    <div class="pay-row"><span class="pay-label">Account</span> <span class="pay-val">1882242481</span></div>
                    <div class="pay-row"><span class="pay-label">Reference</span> <span class="pay-val" style="color:#f0b90b;">BlezzyPay</span></div>
                </div>

                <div class="pay-card">
                    <div class="pay-title"><i class="fa-brands fa-bitcoin"></i> Bitcoin</div>
                    <div style="font-family: monospace; word-break: break-all; background: #000; padding: 10px; border-radius: 5px; border: 1px solid #444;">
                        bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7
                    </div>
                </div>

                <form action="/confirm-payment-sent" method="POST">
                    <button class="btn-sent">✅ I HAVE SENT PAYMENT</button>
                </form>

                <a href="https://wa.me/46704406175" target="_blank" class="wa-btn">
                    <i class="fa-brands fa-whatsapp"></i> Chat with Support
                </a>
                
                <div style="text-align:center; margin-top:20px;">
                    <a href="/cancel-deposit" style="color:#f44336; font-size:12px;">Cancel Deposit</a>
                </div>
            </div>
        </body>
    `);
});

app.post('/confirm-payment-sent', (req, res) => {
    const user = findUser(req.session.userId);
    if (user.pendingDeposit) user.pendingDeposit.status = "Pending Admin Review";
    res.redirect('/dashboard');
});

app.get('/cancel-deposit', (req, res) => {
    const user = findUser(req.session.userId);
    user.pendingDeposit = null;
    res.redirect('/dashboard');
});

// --- 6. ADMIN PANEL ---
app.get('/admin', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.send("Access Denied");

    const pendingUsers = users.filter(u => u.pendingDeposit && u.pendingDeposit.status === "Pending Admin Review");

    res.send(`
        <body style="background:#eee; font-family:sans-serif; padding:20px;">
            <h1>Admin Dashboard</h1>
            <h3>Pending Deposits</h3>
            ${pendingUsers.length === 0 ? "<p>No pending payments.</p>" : ""}
            ${pendingUsers.map(u => `
                <div style="background:white; padding:20px; margin-bottom:10px; border-left:5px solid #f0b90b;">
                    <strong>${u.email}</strong> is claiming a deposit of <strong>$${u.pendingDeposit.amount}</strong>.
                    <form action="/admin/confirm-deposit" method="POST" style="margin-top:10px;">
                        <input type="hidden" name="userId" value="${u.id}">
                        <button style="background:green; color:white; border:none; padding:10px 20px; cursor:pointer;">CONFIRM & SEND RECEIPT</button>
                    </form>
                </div>
            `).join('')}
            <br><a href="/logout">Logout</a>
        </body>
    `);
});

app.post('/admin/confirm-deposit', (req, res) => {
    const admin = findUser(req.session.userId);
    if (!admin.isAdmin) return res.redirect('/');
    const targetUser = findUser(req.body.userId);

    if (targetUser && targetUser.pendingDeposit) {
        const amount = targetUser.pendingDeposit.amount;
        const bonus = amount * 0.20;
        targetUser.balance += amount; 
        targetUser.agtTokens += amount; 
        targetUser.lockedBonus += bonus;
        
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + 30);
        targetUser.bonusUnlockDate = unlockDate;

        targetUser.transactions.push({ type: "Deposit Confirmed", amount: amount, date: new Date().toLocaleDateString() });
        targetUser.transactions.push({ type: "20% Bonus (Locked)", amount: bonus, date: new Date().toLocaleDateString() });
        
        generatePDFReceipt(targetUser, amount, bonus);
        targetUser.pendingDeposit = null;
    }
    res.redirect('/admin');
});

function generatePDFReceipt(user, amount, bonus) {
    const doc = new PDFDocument();
    console.log(`--- SENDING RECEIPT TO ${user.email} ---`);
    doc.fontSize(20).text('BlezzyPay Receipt', 100, 100);
    doc.fontSize(12).text(`Amount: $${amount}`);
    doc.text(`Bonus: $${bonus} (Locked 30 Days)`);
    doc.text('Status: CONFIRMED');
    doc.end();
}

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
