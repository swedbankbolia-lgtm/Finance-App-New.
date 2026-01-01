const express = require('express');
const session = require('express-session');
const app = express();

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'blezzy_key_99', resave: false, saveUninitialized: true }));

// --- PARTNERS (Strictly Citi & Morgan Stanley) ---
const partners = [
    { 
        name: "Citi", 
        link: "https://www.citigroup.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Citi.svg" 
    },
    { 
        name: "Morgan Stanley", 
        link: "https://www.morganstanley.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg" 
    }
];

// --- DATABASE (In-Memory) ---
const users = [
    { 
        id: "admin", 
        email: "emmanuel.iyere84@gmail.com", 
        passcode: "1234", 
        isAdmin: true, 
        transactions: [] 
    },
    { 
        id: "user1", 
        email: "user@test.com", 
        passcode: "1111", 
        name: "Demo User",
        phone: "+1 555 0199",
        address: "Maputo, Mozambique",
        kycStatus: "Verified", // Unverified, Pending, Verified
        
        balance: 0, 
        lockedCapital: 1000, 
        lockedProfit: 200, 
        maturityDate: "2/1/2026", 
        agtTokens: 1000, 
        isAdmin: false, 
        transactions: [
            { type: "Deposit", amount: 1000, date: "1/1/2026", details: "Locked" }, 
            { type: "Pending Yield", amount: 200, date: "1/1/2026", details: "Releases Feb 1" }
        ], 
        pendingDeposit: null 
    }
];

const findUser = (id) => users.find(u => u.id === id);
const findUserByEmail = (e) => users.find(u => u.email.trim().toLowerCase() === e.trim().toLowerCase());

// --- ROUTES: AUTHENTICATION ---

// Login Page
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#f4f6f8;color:#333;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:white;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
    input{width:100%;padding:15px;margin:10px 0;background:#fff;border:1px solid #ccc;color:#333;border-radius:8px;box-sizing:border-box}
    button{width:100%;padding:15px;background:#f0b90b;border:none;font-weight:bold;border-radius:8px;cursor:pointer;margin-top:10px;color:#000}
    a{color:#f0b90b;text-decoration:none;font-size:12px;margin-top:15px;display:block;font-weight:bold}
    </style></head><body><div class="box"><h2 style="color:#f0b90b">BlezzyPay</h2>
    <form action="/login" method="POST">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="passcode" placeholder="Passcode" required>
        <button>SECURE LOGIN</button>
    </form>
    <a href="/signup">Create New Account</a>
    </div></body></html>`);
});

// Sign Up Page
app.get('/signup', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#f4f6f8;color:#333;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:white;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
    input{width:100%;padding:15px;margin:10px 0;background:#fff;border:1px solid #ccc;color:#333;border-radius:8px;box-sizing:border-box}
    button{width:100%;padding:15px;background:#333;border:none;font-weight:bold;border-radius:8px;cursor:pointer;margin-top:10px;color:white}
    a{color:#666;text-decoration:none;font-size:12px;margin-top:15px;display:block}
    </style></head><body><div class="box"><h2>New Account</h2>
    <form action="/register" method="POST">
        <input type="text" name="name" placeholder="Full Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="text" name="phone" placeholder="Phone Number" required>
        <input type="password" name="passcode" placeholder="Create Passcode" required>
        <button>REGISTER</button>
    </form>
    <a href="/">Back to Login</a>
    </div></body></html>`);
});

app.post('/register', (req, res) => {
    const { name, email, phone, passcode } = req.body;
    if (findUserByEmail(email)) return res.send("Email already exists. <a href='/signup'>Try Again</a>");
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        email, passcode, name, phone,
        address: "Not Set",
        kycStatus: "Unverified",
        balance: 0, lockedCapital: 0, lockedProfit: 0, agtTokens: 0,
        isAdmin: false, transactions: [], pendingDeposit: null
    };
    users.push(newUser);
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const user = findUserByEmail(req.body.email);
    if (user && user.passcode === req.body.passcode.trim()) {
        req.session.userId = user.id;
        return res.redirect(user.isAdmin ? '/admin' : '/dashboard');
    }
    res.send('Invalid Credentials. <a href="/">Try Again</a>');
});

// --- ROUTES: DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const u = findUser(req.session.userId);
    if (!u) return res.redirect('/'); // Handle deleted user
    if (u.isAdmin) return res.redirect('/admin');

    const logos = partners.map(p => `<a href="${p.link}" target="_blank"><img src="${p.img}" title="${p.name}" class="logo"></a>`).join('');
    
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body{background:#f4f6f8;color:#333;font-family:sans-serif;margin:0;padding-bottom:100px}
        .tick{background:#1c2026;color:white;padding:10px;border-bottom:1px solid #ddd;white-space:nowrap;overflow:hidden;font-size:12px;font-weight:bold}
        .con{padding:20px;max-width:480px;margin:0 auto}
        .card{background:linear-gradient(135deg, #ffffff, #f9f9f9);padding:25px;border-radius:20px;margin-bottom:20px;box-shadow:0 4px 15px rgba(0,0,0,0.05);border:1px solid #eee}
        .btn{width:48%;padding:15px;border-radius:12px;border:none;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.1)}
        .btn-y{background:#f0b90b;color:#000} .btn-g{background:#fff;color:#333;border:1px solid #ddd}
        .row{display:flex;justify-content:space-between;margin-bottom:10px}
        .stat{background:white;padding:15px;border-radius:15px;width:48%;box-sizing:border-box;box-shadow:0 2px 10px rgba(0,0,0,0.05)}
        
        .logo-wrap{background:white;padding:20px 0;overflow:hidden;white-space:nowrap;border-top:1px solid #eee; text-align:center;}
        .logo{height:45px;margin:0 25px;opacity:0.8;vertical-align:middle;transition:0.3s} 
        .logo:hover{opacity:1;transform:scale(1.1)}

        .tx-item{background:white;padding:15px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 5px rgba(0,0,0,0.05)}
        .modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);align-items:flex-end;justify-content:center;backdrop-filter:blur(2px)}
        .m-con{background:white;width:100%;max-width:500px;padding:30px;border-radius:24px 24px 0 0;box-shadow:0 -5px 20px rgba(0,0,0,0.1)}
        input,select{width:100%;padding:15px;background:#f9f9f9;border:1px solid #ddd;color:#333;margin:10px 0;border-radius:8px;box-sizing:border-box}
        .top-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .set-btn{color:#666;font-size:20px;text-decoration:none}
        .kyc-badge{font-size:10px; padding:3px 8px; border-radius:10px; background:#ddd; color:#555; vertical-align:middle;}
        .verified{background:#e8f5e9; color:#2e7d32;}
    </style></head><body>
    <div class="tick">BTC $98,420 &nbsp;&nbsp; ETH $3,150 &nbsp;&nbsp; XRP $1.12 &nbsp;&nbsp; USDT $1.00</div>
    <div class="con">
        <div class="top-nav">
            <div>
                <h3>Hi ${u.name.split(' ')[0]} 
                    <span class="kyc-badge ${u.kycStatus === 'Verified' ? 'verified' : ''}">${u.kycStatus}</span>
                </h3>
                <p style="margin:0;font-size:12px;color:#888">BlezzyPay Premier</p>
            </div>
            <div>
                <a href="/settings" class="set-btn" style="margin-right:15px"><i class="fa-solid fa-gear"></i></a>
                <a href="/logout" style="color:red;text-decoration:none;font-weight:bold"><i class="fa-solid fa-power-off"></i></a>
            </div>
        </div>

        ${u.pendingDeposit ? `<div style="background:#fff3cd;padding:15px;border-radius:10px;margin-bottom:20px;color:#856404;border:1px solid #ffeeba"><b>Pending: $${u.pendingDeposit.amount}</b> <a href="/pay-now" style="color:#856404;font-weight:bold">PAY NOW</a></div>` : ''}
        
        <div class="card" style="background:#fff;border:1px solid #e0e0e0">
            <div style="color:#666;font-size:12px">Total Assets</div>
            <div style="font-size:32px;font-weight:bold;color:#333">$${(u.balance+u.lockedCapital+u.lockedProfit).toFixed(2)}</div>
            <div class="row" style="margin-top:20px;border-top:1px solid #eee;padding-top:10px">
                <div><small style="color:#666">CASH</small><br><b style="color:#00c853">$${u.balance.toFixed(2)}</b></div>
                <div style="text-align:right"><small style="color:#666">LOCKED</small><br><b style="color:#333">$${u.lockedCapital.toFixed(2)}</b></div>
            </div>
        </div>

        <div class="row">
            <button class="btn btn-y" onclick="openM('dep')">DEPOSIT</button>
            <button class="btn btn-g" onclick="openM('with')">WITHDRAW</button>
        </div>

        <div class="row">
            <div class="stat"><small style="color:#666">Pending Yield</small><br><b style="color:#f0b90b">$${u.lockedProfit}</b><br><small style="font-size:9px;color:#999">Releases in 30 Days</small></div>
            <div class="stat"><small style="color:#666">Earned</small><br><b style="color:#00c853">$${u.balance}</b></div>
        </div>

        <h3>History</h3>
        ${u.transactions.length === 0 ? '<p style="color:#999;font-size:12px">No transactions yet.</p>' : ''}
        ${u.transactions.slice().reverse().map(t => `<div class="tx-item"><div><b>${t.type}</b><br><small style="color:#666">${t.details||t.date}</small></div><b>$${t.amount}</b></div>`).join('')}
    </div>

    <div style="text-align:center;font-size:10px;color:#999;text-transform:uppercase;font-weight:bold;background:white;padding-top:20px;">Trusted Partners</div>
    <div class="logo-wrap">
        ${logos}
    </div>

    <div id="dep" class="modal"><div class="m-con">
        <h3>Deposit (Locked 30 Days)</h3><form action="/dep" method="POST">
        <input type="number" name="amount" placeholder="Amount" required><button class="btn btn-y" style="width:100%">PROCEED</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#666;cursor:pointer">Close</button>
    </div></div>

    <div id="with" class="modal"><div class="m-con">
        <h3>Withdraw Cash ($${u.balance})</h3><form action="/with" method="POST">
        <input type="number" name="amount" placeholder="Amount" max="${u.balance}" required>
        <select name="type"><option value="std">Standard (48h) - Free</option><option value="inst">Instant - 3% Fee</option></select>
        <input placeholder="Bank Name" required><input placeholder="Account No" required>
        <button class="btn btn-y" style="width:100%">SUBMIT</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#666;cursor:pointer">Close</button>
    </div></div>

    <script>
    function openM(id){document.getElementById(id).style.display='flex'}
    function closeM(){document.querySelectorAll('.modal').forEach(e=>e.style.display='none')}
    </script>
    </body></html>`);
});

// --- SETTINGS & KYC ---
app.get('/settings', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const u = findUser(req.session.userId);
    
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body{background:#f4f6f8;color:#333;font-family:sans-serif;margin:0;padding:20px}
        .con{max-width:480px;margin:0 auto}
        .card{background:white;padding:25px;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.05);margin-bottom:20px}
        .label{font-size:12px;color:#888;margin-bottom:5px;display:block}
        .val{font-size:16px;font-weight:bold;margin-bottom:15px;display:block;border-bottom:1px solid #eee;padding-bottom:10px}
        .btn-close{width:100%;padding:15px;background:#ffebee;color:#d32f2f;border:none;font-weight:bold;border-radius:12px;cursor:pointer}
        .btn-kyc{width:100%;padding:15px;background:#2c333e;color:white;border:none;font-weight:bold;border-radius:12px;cursor:pointer;margin-bottom:10px}
    </style></head><body>
    <div class="con">
        <a href="/dashboard" style="color:#333;text-decoration:none;font-weight:bold;margin-bottom:20px;display:block"><i class="fa-solid fa-arrow-left"></i> Back</a>
        <h2 style="margin-bottom:20px">Client Settings</h2>
        
        <div class="card">
            <span class="label">Full Name</span><span class="val">${u.name}</span>
            <span class="label">Email Address</span><span class="val">${u.email}</span>
            <span class="label">Phone Number</span><span class="val">${u.phone}</span>
            <span class="label">Address</span><span class="val">${u.address}</span>
            
            <span class="label">KYC Status</span>
            <span class="val" style="color:${u.kycStatus==='Verified'?'green':'orange'}">${u.kycStatus}</span>
            
            ${u.kycStatus === 'Unverified' ? `<form action="/kyc-page"><button class="btn-kyc">VERIFY IDENTITY (KYC)</button></form>` : ''}
        </div>

        <form action="/close-account" method="POST">
            <button class="btn-close">CLOSE ACCOUNT PERMANENTLY</button>
        </form>
    </div></body></html>`);
});

app.get('/kyc-page', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#f4f6f8;color:#333;font-family:sans-serif;padding:20px;text-align:center}
    .box{background:white;padding:30px;border-radius:20px;max-width:400px;margin:20px auto;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
    input{width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px}
    button{width:100%;padding:15px;background:#00c853;color:white;border:none;border-radius:10px;font-weight:bold;cursor:pointer}
    </style></head><body>
    <div class="box">
        <h2>KYC Verification</h2>
        <p style="color:#666">Upload your ID or Passport to verify your account.</p>
        <form action="/submit-kyc" method="POST">
            <label style="display:block;text-align:left;font-size:12px;color:#888">Document Type</label>
            <select style="width:100%;padding:10px;margin-bottom:10px"><option>Passport</option><option>National ID</option></select>
            <div style="border:2px dashed #ccc;padding:30px;margin-bottom:20px;color:#999">Click to Upload Image</div>
            <button>SUBMIT DOCUMENTS</button>
        </form>
        <a href="/settings" style="display:block;margin-top:20px;color:#666;text-decoration:none">Cancel</a>
    </div></body></html>`);
});

app.post('/submit-kyc', (req, res) => {
    const u = findUser(req.session.userId);
    u.kycStatus = "Pending"; // Simulate submission
    res.redirect('/settings');
});

app.post('/close-account', (req, res) => {
    // In a real app, delete from DB. Here, we just log them out and remove from array.
    const idx = users.findIndex(u => u.id === req.session.userId);
    if (idx !== -1) users.splice(idx, 1);
    req.session.destroy();
    res.redirect('/');
});

// --- ACTIONS ---
app.post('/dep', (req, res) => {
    const u = findUser(req.session.userId);
    u.pendingDeposit = { amount: parseFloat(req.body.amount), status: "Wait", date: new Date() };
    res.redirect('/pay-now');
});

app.get('/pay-now', (req, res) => {
    const u = findUser(req.session.userId);
    if (!u.pendingDeposit) return res.redirect('/dashboard');
    res.send(`<body style="background:#f4f6f8;color:#333;font-family:sans-serif;padding:20px;text-align:center">
    <h1 style="color:#f0b90b">$${u.pendingDeposit.amount}</h1>
    <div style="background:white;padding:20px;margin:10px 0;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
    <b>US:</b> Bank of America | 026009593<br><br><b>EU:</b> Barclay | GB33BARC20658259151311<br><br><b>Bitcoin:</b> bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7
    </div>
    <form action="/sent" method="POST"><button style="padding:15px;width:100%;background:#00c853;border:none;font-weight:bold;cursor:pointer;color:white;border-radius:10px">I SENT PAYMENT</button></form>
    </body>`);
});

app.post('/sent', (req, res) => { findUser(req.session.userId).pendingDeposit.status = "Pending"; res.redirect('/dashboard'); });

app.post('/with', (req, res) => {
    const u = findUser(req.session.userId);
    const amt = parseFloat(req.body.amount);
    const fee = req.body.type === 'inst' ? amt * 0.03 : 0;
    if (amt > 0 && u.balance >= amt) {
        u.balance -= amt;
        u.transactions.push({ type: req.body.type === 'inst' ? "Instant Withdraw" : "Standard Withdraw", amount: -amt, details: `Fee: $${fee} | Net: $${amt-fee}` });
    }
    res.redirect('/dashboard');
});

// --- ADMIN ---
app.get('/admin', (req, res) => {
    const u = findUser(req.session.userId);
    if (!u || !u.isAdmin) return res.redirect('/');
    const pending = users.filter(x => x.pendingDeposit && x.pendingDeposit.status === "Pending");
    res.send(`<body style="background:#eee;padding:20px;font-family:sans-serif">
    <h1>Admin</h1>
    <form action="/release" method="POST"><button style="padding:10px;background:black;color:#f0b90b;font-weight:bold;cursor:pointer">⚡ PROCESS 30-DAY PAYOUTS</button></form>
    <hr>
    ${pending.map(x => `<div><b>${x.email}</b> claims $${x.pendingDeposit.amount} 
    <form action="/confirm" method="POST" style="display:inline"><input type="hidden" name="uid" value="${x.id}"><button>CONFIRM</button></form></div>`).join('')}
    </body>`);
});

app.post('/confirm', (req, res) => {
    const u = findUser(req.body.uid);
    if (u && u.pendingDeposit) {
        const amt = u.pendingDeposit.amount;
        u.lockedCapital += amt;
        u.lockedProfit += (amt * 0.20);
        u.transactions.push({ type: "Deposit", amount: amt, details: "Locked 30 Days" });
        u.pendingDeposit = null;
    }
    res.redirect('/admin');
});

app.post('/release', (req, res) => {
    users.forEach(u => {
        if (!u.isAdmin && u.lockedProfit > 0) {
            const pay = u.lockedProfit;
            u.balance += pay;
            u.lockedProfit = 0;
            u.transactions.push({ type: "Maturity Payout", amount: pay, details: "Moved to Cash" });
        }
    });
    res.redirect('/admin');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
