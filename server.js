const express = require('express');
const session = require('express-session');
const app = express();

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'blezzy_key_99', resave: false, saveUninitialized: true }));

// --- PARTNERS ---
const partners = [
    { name: "Citi", link: "https://www.citigroup.com", img: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Citi.svg" },
    { name: "Morgan Stanley", link: "https://www.morganstanley.com", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg" }
];

// --- DATABASE (In-Memory) ---
const users = [
    { 
        id: "admin", email: "emmanuel.iyere84@gmail.com", passcode: "1234", isAdmin: true, transactions: [] 
    },
    { 
        id: "user1", email: "user@test.com", passcode: "1111", 
        name: "Demo User", phone: "+1 555 0199", address: "Maputo, Mozambique", kycStatus: "Verified",
        balance: 0, lockedCapital: 1000, lockedProfit: 200, maturityDate: "2/1/2026", agtTokens: 1000, 
        isAdmin: false, 
        transactions: [
            { type: "Deposit", amount: 1000, date: "1/1/2026", details: "Capital Locked Forever" }, 
            { type: "Pending Yield", amount: 200, date: "1/1/2026", details: "Releases Feb 1" }
        ], 
        pendingDeposit: null 
    }
];

const findUser = (id) => users.find(u => u.id === id);
const findUserByEmail = (e) => users.find(u => u.email.trim().toLowerCase() === e.trim().toLowerCase());

// --- ROUTES ---

// Login
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#0f1216;color:white;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:#1c2026;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #333}
    input{width:100%;padding:15px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:8px;box-sizing:border-box}
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

// Sign Up
app.get('/signup', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#0f1216;color:white;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:#1c2026;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #333}
    input{width:100%;padding:15px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:8px;box-sizing:border-box}
    button{width:100%;padding:15px;background:#f0b90b;border:none;font-weight:bold;border-radius:8px;cursor:pointer;margin-top:10px;color:black}
    a{color:#888;text-decoration:none;font-size:12px;margin-top:15px;display:block}
    </style></head><body><div class="box"><h2>New Account</h2>
    <form action="/register" method="POST">
        <input type="text" name="name" placeholder="Full Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="text" name="phone" placeholder="Phone Number" required>
        <input type="text" name="address" placeholder="Home Address (City, Country)" required>
        <input type="password" name="passcode" placeholder="Create Passcode" required>
        <button>REGISTER</button>
    </form>
    <a href="/">Back to Login</a>
    </div></body></html>`);
});

app.post('/register', (req, res) => {
    const { name, email, phone, address, passcode } = req.body;
    if (findUserByEmail(email)) return res.send("Email already exists. <a href='/signup'>Try Again</a>");
    users.push({
        id: Date.now().toString(), email, passcode, name, phone, address, 
        kycStatus: "Unverified", balance: 0, lockedCapital: 0, lockedProfit: 0, 
        isAdmin: false, transactions: [], pendingDeposit: null
    });
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

// --- DASHBOARD (WITH AI CHAT) ---
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const u = findUser(req.session.userId);
    if (!u) return res.redirect('/');
    if (u.isAdmin) return res.redirect('/admin');

    const logos = partners.map(p => `<a href="${p.link}" target="_blank"><img src="${p.img}" title="${p.name}" class="logo"></a>`).join('');
    
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body{background:#0f1216;color:white;font-family:sans-serif;margin:0;padding-bottom:100px}
        .tick{background:#16191f;color:white;padding:10px;border-bottom:1px solid #222;white-space:nowrap;overflow:hidden;font-size:12px;font-weight:bold}
        .con{padding:20px;max-width:480px;margin:0 auto}
        .card{background:linear-gradient(135deg, #2b323b 0%, #1c2026 100%);color:white;padding:25px;border-radius:20px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #333}
        .btn{width:48%;padding:15px;border-radius:12px;border:none;font-weight:bold;cursor:pointer;}
        .btn-y{background:#f0b90b;color:#000} .btn-g{background:#2c333e;color:white;border:1px solid #333}
        .row{display:flex;justify-content:space-between;margin-bottom:10px}
        .stat{background:#1c2026;color:white;padding:15px;border-radius:15px;width:48%;box-sizing:border-box;border:1px solid #333}
        .logo-wrap{background:black;padding:20px 0;overflow:hidden;white-space:nowrap;border-top:1px solid #222; text-align:center;}
        .logo{height:45px;margin:0 25px;opacity:0.8;vertical-align:middle;transition:0.3s; filter:brightness(0) invert(1);} 
        .logo:hover{opacity:1;transform:scale(1.1)}
        .tx-item{background:#181b21;color:white;padding:15px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #222}
        .modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);align-items:flex-end;justify-content:center;backdrop-filter:blur(2px)}
        .m-con{background:#1c2026;color:white;width:100%;max-width:500px;padding:30px;border-radius:24px 24px 0 0;border-top:1px solid #333}
        input,select{width:100%;padding:15px;background:#0b0e11;border:1px solid #333;color:white;margin:10px 0;border-radius:8px;box-sizing:border-box}
        .top-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .kyc-badge{font-size:10px; padding:3px 8px; border-radius:10px; background:#333; color:#aaa; vertical-align:middle;}
        .verified{background:rgba(0, 200, 83, 0.2); color:#00c853; font-weight:bold}

        /* AI CHAT STYLES */
        .ai-float{position:fixed;bottom:20px;right:20px;background:#f0b90b;color:black;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 5px 20px rgba(240, 185, 11, 0.4);cursor:pointer;z-index:999;}
        .chat-box{display:none;position:fixed;bottom:90px;right:20px;width:300px;background:#1c2026;border-radius:20px;border:1px solid #333;box-shadow:0 10px 40px rgba(0,0,0,0.5);overflow:hidden;z-index:999;flex-direction:column;}
        .chat-head{background:#f0b90b;padding:15px;color:black;font-weight:bold;display:flex;justify-content:space-between;align-items:center;}
        .chat-msgs{height:300px;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:10px;}
        .msg{padding:8px 12px;border-radius:12px;max-width:80%;font-size:13px;line-height:1.4;}
        .msg-ai{background:#2c333e;color:white;align-self:flex-start;border-bottom-left-radius:0;}
        .msg-u{background:#f0b90b;color:black;align-self:flex-end;border-bottom-right-radius:0;}
        .chat-inp{display:flex;border-top:1px solid #333;padding:10px;background:#16191f;}
        .chat-inp input{margin:0;border:none;background:transparent;flex:1;outline:none;}
        .chat-inp button{width:auto;margin:0;padding:8px 15px;border-radius:50px;background:#f0b90b;color:black;}
    </style></head><body>
    <div class="tick">BTC $98,420 &nbsp;&nbsp; ETH $3,150 &nbsp;&nbsp; XRP $1.12 &nbsp;&nbsp; USDT $1.00</div>
    <div class="con">
        <div class="top-nav">
            <div>
                <h3 style="margin:0">Hi ${u.name.split(' ')[0]} <span class="kyc-badge ${u.kycStatus==='Verified'?'verified':''}">${u.kycStatus}</span></h3>
                <p style="margin:5px 0 0 0;font-size:12px;color:#888">BlezzyPay Premier</p>
            </div>
            <div>
                <a href="/settings" style="color:white;font-size:20px;margin-right:15px"><i class="fa-solid fa-gear"></i></a>
                <a href="/logout" style="color:#ff4757;font-size:20px"><i class="fa-solid fa-power-off"></i></a>
            </div>
        </div>

        ${u.pendingDeposit ? `<div style="background:#e67e22;padding:15px;border-radius:10px;margin-bottom:20px;color:black;"><b>Pending: $${u.pendingDeposit.amount}</b> <a href="/pay-now" style="color:white;font-weight:bold;margin-left:10px">PAY NOW</a></div>` : ''}
        
        <div class="card">
            <div style="color:#888;font-size:12px">Total Assets</div>
            <div style="font-size:32px;font-weight:bold;color:white">$${(u.balance+u.lockedCapital+u.lockedProfit).toFixed(2)}</div>
            <div class="row" style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px">
                <div><small style="color:#888">CASH (Available)</small><br><b style="color:#00c853">$${u.balance.toFixed(2)}</b></div>
                <div style="text-align:right"><small style="color:#888">LOCKED ALWAYS</small><br><b style="color:white">$${u.lockedCapital.toFixed(2)}</b></div>
            </div>
        </div>

        <div class="row">
            <button class="btn btn-y" onclick="openM('dep')">DEPOSIT</button>
            <button class="btn btn-g" onclick="openM('with')">WITHDRAW</button>
        </div>

        <div class="row">
            <div class="stat"><small style="color:#888">Pending Yield</small><br><b style="color:#f0b90b">$${u.lockedProfit}</b><br><small style="font-size:9px;color:#666">Locked until Day 30</small></div>
            <div class="stat"><small style="color:#888">Earned Cash</small><br><b style="color:#00c853">$${u.balance}</b></div>
        </div>

        <h3>History</h3>
        ${u.transactions.slice().reverse().map(t => `<div class="tx-item"><div><b>${t.type}</b><br><small style="color:#888">${t.details||t.date}</small></div><b>$${t.amount}</b></div>`).join('')}
    </div>

    <div style="text-align:center;font-size:10px;color:#666;text-transform:uppercase;font-weight:bold;background:black;padding-top:20px;margin-top:20px;border-top:1px solid #222">Strategic Partners</div>
    <div class="logo-wrap">${logos}</div>

    <div class="ai-float" onclick="toggleChat()"><i class="fa-solid fa-robot"></i></div>
    <div class="chat-box" id="chatBox">
        <div class="chat-head"><span>Blezzy AI</span><i class="fa-solid fa-xmark" onclick="toggleChat()" style="cursor:pointer"></i></div>
        <div class="chat-msgs" id="chatMsgs">
            <div class="msg msg-ai">Hello ${u.name.split(' ')[0]}! I am Blezzy AI. How can I help you today?</div>
        </div>
        <div class="chat-inp">
            <input type="text" id="userMsg" placeholder="Ask about deposit, yield..." onkeypress="handleEnter(event)">
            <button onclick="sendMsg()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    </div>

    <div id="dep" class="modal"><div class="m-con">
        <h3>Deposit Funds</h3><form action="/dep" method="POST">
        <input type="number" name="amount" placeholder="Amount (USD)" required><button class="btn btn-y" style="width:100%">PROCEED</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#888;cursor:pointer">Close</button>
    </div></div>

    <div id="with" class="modal"><div class="m-con">
        <h3>Withdraw Interest ($${u.balance})</h3><form action="/with" method="POST">
        <input type="number" name="amount" placeholder="Amount" max="${u.balance}" required>
        <select name="type"><option value="std">Standard (48h) - Free</option><option value="inst">Instant - 3% Fee</option></select>
        <input placeholder="Bank Name" required><input placeholder="Account No" required>
        <button class="btn btn-y" style="width:100%">SUBMIT</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#888;cursor:pointer">Close</button>
    </div></div>

    <script>
    function openM(id){document.getElementById(id).style.display='flex'}
    function closeM(){document.querySelectorAll('.modal').forEach(e=>e.style.display='none')}
    
    // AI CHAT LOGIC
    function toggleChat() {
        const box = document.getElementById('chatBox');
        box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
    }
    function handleEnter(e) { if(e.key === 'Enter') sendMsg(); }
    
    function sendMsg() {
        const input = document.getElementById('userMsg');
        const txt = input.value.trim();
        if(!txt) return;
        
        addMsg(txt, 'u');
        input.value = '';
        
        // Simulating AI Thinking
        setTimeout(() => {
            let reply = "I'm not sure about that. Try asking about deposits or withdrawals.";
            const l = txt.toLowerCase();
            
            if(l.includes('deposit')) reply = "To deposit, click the DEPOSIT button. Funds are permanently locked to generate yield.";
            else if(l.includes('withdraw')) reply = "You can only withdraw your 'Earned Cash'. Your capital remains locked.";
            else if(l.includes('yield') || l.includes('profit')) reply = "You earn 20% interest on your locked capital. This unlocks every 30 days.";
            else if(l.includes('kyc') || l.includes('verify')) reply = "Go to Settings (Gear Icon) to verify your identity.";
            else if(l.includes('hello') || l.includes('hi')) reply = "Hello! Ready to grow your wealth today?";
            
            addMsg(reply, 'ai');
        }, 800);
    }
    
    function addMsg(txt, type) {
        const area = document.getElementById('chatMsgs');
        const div = document.createElement('div');
        div.className = 'msg msg-' + type;
        div.innerText = txt;
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;
    }
    </script>
    </body></html>`);
});

// --- SETTINGS ---
app.get('/settings', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const u = findUser(req.session.userId);
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{background:#0f1216;color:white;font-family:sans-serif;padding:20px}.card{background:#1c2026;padding:20px;border-radius:15px;margin-bottom:20px;border:1px solid #333}label{color:#888;font-size:12px;display:block}span{font-weight:bold;font-size:16px;display:block;margin-bottom:15px;border-bottom:1px solid #333;padding-bottom:5px}</style></head><body>
    <a href="/dashboard" style="color:white;text-decoration:none;margin-bottom:20px;display:block">Back</a>
    <h2>Settings</h2>
    <div class="card">
        <label>Name</label><span>${u.name}</span>
        <label>Email</label><span>${u.email}</span>
        <label>Phone</label><span>${u.phone}</span>
        <label>Address</label><span>${u.address}</span>
        <label>Status</label><span style="color:${u.kycStatus==='Verified'?'#00c853':'orange'}">${u.kycStatus}</span>
        ${u.kycStatus === 'Unverified' ? `<a href="/kyc-page" style="display:block;background:#f0b90b;color:black;padding:10px;text-align:center;border-radius:5px;text-decoration:none;font-weight:bold">VERIFY KYC</a>` : ''}
    </div>
    <form action="/close-account" method="POST"><button style="width:100%;padding:15px;background:#2c333e;color:#ff4757;border:1px solid #ff4757;border-radius:10px;font-weight:bold">CLOSE ACCOUNT</button></form>
    </body></html>`);
});

app.get('/kyc-page', (req, res) => {
    res.send(`<body style="background:#0f1216;color:white;font-family:sans-serif;padding:20px;text-align:center">
    <h2>KYC Verification</h2><p style="color:#888">Upload ID/Passport</p>
    <form action="/submit-kyc" method="POST"><button style="background:#00c853;color:white;padding:15px;border:none;border-radius:10px;width:100%;font-weight:bold">UPLOAD & VERIFY</button></form>
    </body>`);
});

app.post('/submit-kyc', (req, res) => { findUser(req.session.userId).kycStatus = "Pending"; res.redirect('/settings'); });
app.post('/close-account', (req, res) => { users.splice(users.findIndex(u=>u.id===req.session.userId),1); req.session.destroy(); res.redirect('/'); });

// --- PAYMENTS ---
app.post('/dep', (req, res) => {
    const u = findUser(req.session.userId);
    u.pendingDeposit = { amount: parseFloat(req.body.amount), status: "Wait", date: new Date() };
    res.redirect('/pay-now');
});

app.get('/pay-now', (req, res) => {
    const u = findUser(req.session.userId);
    if (!u.pendingDeposit) return res.redirect('/dashboard');
    res.send(`<body style="background:#0f1216;color:white;font-family:sans-serif;padding:20px;">
    <div style="max-width:400px;margin:0 auto">
        <h1 style="color:#f0b90b;text-align:center">$${u.pendingDeposit.amount}</h1>
        
        <div style="background:#1c2026;padding:20px;border-radius:12px;margin-bottom:15px;border:1px solid #333">
            <h3 style="color:#f0b90b;margin-top:0;border-bottom:1px solid #333;padding-bottom:10px">🇺🇸 US Account</h3>
            <p style="margin:5px 0"><b>Bank:</b> Bank of America</p>
            <p style="margin:5px 0"><b>Account:</b> 026009593</p>
        </div>

        <div style="background:#1c2026;padding:20px;border-radius:12px;margin-bottom:15px;border:1px solid #333">
            <h3 style="color:#f0b90b;margin-top:0;border-bottom:1px solid #333;padding-bottom:10px">🇪🇺 EU Account</h3>
            <p style="margin:5px 0"><b>Bank:</b> Barclay</p>
            <p style="margin:5px 0"><b>Name:</b> Hillside (Sports) GP Limited</p>
            <p style="margin:5px 0"><b>Account:</b> GB33BARC20658259151311</p>
            <p style="margin:5px 0"><b>Ref:</b> infogloirebanco</p>
        </div>

        <div style="background:#1c2026;padding:20px;border-radius:12px;margin-bottom:15px;border:1px solid #333">
            <h3 style="color:#f0b90b;margin-top:0;border-bottom:1px solid #333;padding-bottom:10px">🇺🇬 Africa (Uganda)</h3>
            <p style="margin:5px 0"><b>Bank:</b> Equity Bank</p>
            <p style="margin:5px 0"><b>Account:</b> 1003103498481</p>
            <p style="margin:5px 0"><b>Ref:</b> Annet</p>
        </div>

        <div style="background:#1c2026;padding:20px;border-radius:12px;margin-bottom:15px;border:1px solid #333">
            <h3 style="color:#f0b90b;margin-top:0;border-bottom:1px solid #333;padding-bottom:10px">🇿🇦 South Africa</h3>
            <p style="margin:5px 0"><b>Bank:</b> Capitek Bank</p>
            <p style="margin:5px 0"><b>Account:</b> 1882242481</p>
            <p style="margin:5px 0"><b>Ref:</b> BlezzyPay</p>
        </div>

        <div style="background:#1c2026;padding:20px;border-radius:12px;margin-bottom:20px;border:1px solid #333">
            <h3 style="color:#f0b90b;margin-top:0;border-bottom:1px solid #333;padding-bottom:10px">₿ Crypto (Bitcoin)</h3>
            <p style="font-size:12px;word-break:break-all">bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7</p>
        </div>

        <form action="/sent" method="POST"><button style="padding:15px;width:100%;background:#00c853;border:none;font-weight:bold;cursor:pointer;color:white;border-radius:10px">I SENT PAYMENT</button></form>
        <div style="text-align:center;margin-top:15px"><a href="/dashboard" style="color:#888;text-decoration:none">Cancel</a></div>
    </div>
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
    res.send(`<body style="background:#0f1216;color:white;padding:20px;font-family:sans-serif">
    <h1>Admin</h1>
    <form action="/release" method="POST"><button style="padding:10px;background:#f0b90b;color:black;font-weight:bold;cursor:pointer;border:none;border-radius:5px">⚡ PROCESS 30-DAY PAYOUTS</button></form>
    <p style="color:#888;font-size:12px">Clicking above moves "Pending Yield" to "Available Cash". Capital stays Locked.</p>
    <hr style="border-color:#333">
    ${pending.map(x => `<div style="background:#1c2026;padding:10px;margin-bottom:5px;border:1px solid #333"><b>${x.email}</b> claims $${x.pendingDeposit.amount} 
    <form action="/confirm" method="POST" style="display:inline"><input type="hidden" name="uid" value="${x.id}"><button style="background:#00c853;color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:5px;margin-left:10px">CONFIRM</button></form></div>`).join('')}
    </body>`);
});

app.post('/confirm', (req, res) => {
    const u = findUser(req.body.uid);
    if (u && u.pendingDeposit) {
        const amt = u.pendingDeposit.amount;
        u.lockedCapital += amt; // Capital is LOCKED ALWAYS
        u.lockedProfit += (amt * 0.20); // 20% Profit sits in Pending
        u.transactions.push({ type: "Deposit", amount: amt, details: "Capital Locked Forever" });
        u.pendingDeposit = null;
    }
    res.redirect('/admin');
});

app.post('/release', (req, res) => {
    users.forEach(u => {
        if (!u.isAdmin && u.lockedProfit > 0) {
            const pay = u.lockedProfit;
            u.balance += pay; // Move Profit to Cash
            u.lockedProfit = 0; // Reset Pending Profit
            u.transactions.push({ type: "Maturity Payout", amount: pay, details: "Yield Moved to Cash" });
        }
    });
    res.redirect('/admin');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
