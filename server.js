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
        // YOUR PRIMARY ADMIN ACCOUNT
        email: "emmanuel.iyere84@gmail.com", 
        passcode: "1234",                    
        isAdmin: true,
        transactions: []
    },
    {
        id: "admin_backup",
        // BACKUP ADMIN ACCOUNT (Try this if the first one fails)
        email: "admin@test.com", 
        passcode: "1234",                    
        isAdmin: true,
        transactions: []
    },
    {
        id: "user_1",
        // CLIENT TEST ACCOUNT
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

// --- 3. ROBUST LOGIN LOGIC ---
const findUserByEmail = (inputEmail) => {
    const cleanInput = inputEmail.trim().toLowerCase();
    return users.find(u => u.email.toLowerCase() === cleanInput);
};

// --- 4. AUTH ROUTES ---
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
                .note { margin-top:20px; font-size:11px; color:#444; text-align: left; background: #111; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2 style="color:#f0b90b;">BlezzyPay</h2>
                <form action="/login" method="POST">
                    <input type="email" name="email" placeholder="Email" required>
                    <input type="password" name="passcode" placeholder="Passcode" required>
                    <button type="submit">LOGIN</button>
                </form>
                <div class="note">
                    <strong>Admin:</strong> emmanuel.iyere84@gmail.com<br>
                    <strong>Passcode:</strong> 1234<br><br>
                    <strong>User:</strong> user@test.com<br>
                    <strong>Passcode:</strong> 1111
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const passcode = req.body.passcode.trim(); // Only trim spaces, preserve case

    const user = findUserByEmail(email);
    
    // Check credentials
    if (user && user.passcode === passcode) {
        req.session.userId = user.id;
        if(user.isAdmin) return res.redirect('/admin');
        return res.redirect('/dashboard');
    }
    
    // Debug Error View
    res.send(`<body style="background:#0f1216; color:white; text-align:center; padding-top:50px; font-family:sans-serif;">
        <h3 style="color:#f44336;">Access Denied</h3>
        <p><strong>System Status:</strong></p>
        <ul style="list-style:none; padding:0;">
            <li>Email received: "${email}"</li>
            <li>Cleaned Email: "${email.trim().toLowerCase()}"</li>
            <li>User Found in DB: ${user ? "YES" : "NO"}</li>
            <li>Passcode Match: ${user && user.passcode === passcode ? "YES" : "NO"}</li>
        </ul>
        <br>
        <a href="/" style="background:#f0b90b; color:black; padding:10px 20px; text-decoration:none; border-radius:5px;">Try Again</a>
    </body>`);
});

// --- 5. DASHBOARD ---
const findUser = (id) => users.find(u => u.id === id);

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
                .ticker-wrap { width: 100%; overflow: hidden; background: #1e2329; color: #f0b90b; padding: 12px 0; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 50; }
                .ticker { display: flex; white-space: nowrap; animation: ticker 30s linear infinite; }
                .ticker-item { padding: 0 30px; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
                .price-up { color: #4caf50; }
                .price-down { color: #f44336; }
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
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
                .wa-float { position: fixed; bottom: 20px; right: 20px; background: #25
