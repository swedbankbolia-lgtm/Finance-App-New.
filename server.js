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
// Credentials are HARDCODED here.
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
    // Trim removes accidental spaces
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
                .partners-section { background: #0f1216; padding: 15px 0; border-bottom: 1px solid #333; overflow: hidden; }
                .partners-header { text-align: center; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
                .logo-slider { display: flex; width: 200%; animation: scrollLogos 40s linear infinite; }
                .logo-track { display: flex; align-items: center; justify-content: space-around; width: 50%; }
                .partner-logo { height: 25px; margin: 0 20px; opacity: 0.6; filter: grayscale(100%); transition: all 0.3s ease; object-fit: contain; }
                .partner-logo:hover { opacity: 1; filter: grayscale(0%); }
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
                    <div class="ticker-item">ETC: <span id="etc-p2" class="price-up">$...</span></div>
                </div>
            </div>

            <div class="partners-section">
                <div class="partners-header">Trusted by Global Institutions</div>
                <div class="logo-slider">
                    <div class="logo-track">
                        <img src="https
