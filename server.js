const express = require('express');
const session = require('express-session');
const app = express();

// --- CONFIG ---
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'blezzy_key_99', resave: false, saveUninitialized: true }));

// --- PARTNERS (Direct Wiki Links) ---
const partners = [
    { name: "Standard Chartered", link: "https://www.sc.com", img: "https://upload.wikimedia.org/wikipedia/commons/3/36/Standard_Chartered.svg" },
    { name: "Bank of America", link: "https://www.bankofamerica.com", img: "https://upload.wikimedia.org/wikipedia/commons/2/23/Bank_of_America_logo.svg" },
    { name: "BNY Mellon", link: "https://www.bnymellon.com", img: "https://upload.wikimedia.org/wikipedia/commons/f/f4/BNY_Mellon_logo.svg" },
    { name: "Citibank", link: "https://www.citigroup.com", img: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Citi.svg" },
    { name: "BNP Paribas", link: "https://mabanque.bnpparibas", img: "https://upload.wikimedia.org/wikipedia/commons/1/12/BNP_Paribas.svg" },
    { name: "Morgan Stanley", link: "https://www.morganstanley.com", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg" },
    { name: "JPMorgan", link: "https://www.jpmorganchase.com", img: "https://upload.wikimedia.org/wikipedia/commons/d/d7/JPMorgan_Chase_logo_2008.svg" },
    { name: "Goldman Sachs", link: "https://www.goldmansachs.com", img: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Goldman_Sachs.svg" },
    { name: "MUFG", link: "https://www.mufg.jp", img: "https://upload.wikimedia.org/wikipedia/commons/a/a2/MUFG_logo.svg" },
    { name: "Investec", link: "https://www.investec.com", img: "https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Investec_Bank_Logo.svg/1200px-Investec_Bank_Logo.svg.png" },
    { name: "Revolut", link: "https://www.revolut.com", img: "https://upload.wikimedia.org/wikipedia/commons/6/62/Revolut_logo.svg" },
    { name: "Bunq", link: "https://www.bunq.com", img: "https://upload.wikimedia.org/wikipedia/commons/c/bc/Bunq_logo.svg" }
];

// --- DATABASE ---
const users = [
    { id: "admin", email: "emmanuel.iyere84@gmail.com", passcode: "1234", isAdmin: true, transactions: [] },
    { id: "user1", email: "user@test.com", passcode: "1111", balance: 0, lockedCapital: 1000, lockedProfit: 200, maturityDate: "2/1/2026", agtTokens: 1000, isAdmin: false, 
      transactions: [{ type: "Deposit", amount: 1000, date: "1/1/2026", details: "Locked" }, { type: "Pending Yield", amount: 200, date: "1/1/2026", details: "Releases Feb 1" }], pendingDeposit: null }
];

const findUser = (id) => users.find(u => u.id === id);
const findUserByEmail = (e) => users.find(u => u.email.trim().toLowerCase() === e.trim().toLowerCase());

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#0f1216;color:white;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
    .box{background:#1c2026;padding:40px;border-radius:20px;text-align:center;width:100%;max-width:350px}
    input{width:100%;padding:15px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:8px;box-sizing:border-box}
    button{width:100%;padding:15px;background:#f0b90b;border:none;font-weight:bold;border-radius:8px;cursor:pointer;margin-top:10px}
    </style></head><body><div class="box"><h2 style="color:#f0b90b">BlezzyPay</h2><form action="/login" method="POST">
    <input type="email" name="email" placeholder="Email" required><input type="password" name="passcode" placeholder="Passcode" required><button>LOGIN</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    const user = findUserByEmail(req.body.email);
    if (user && user.passcode === req.body.passcode.trim()) {
        req.session.userId = user.id;
        return res.redirect(user.isAdmin ? '/admin' : '/dashboard');
    }
    res.send('Invalid Credentials. <a href="/">Try Again</a>');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/');
    const u = findUser(req.session.userId);
    if (u.isAdmin) return res.redirect('/admin');

    const logos = partners.map(p => `<a href="${p.link}" target="_blank"><img src="${p.img}" title="${p.name}" class="logo"></a>`).join('');
    
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body{background:#0f1216;color:white;font-family:sans-serif;margin:0;padding-bottom:100px}
        .tick{background:#16191f;padding:10px;border-bottom:1px solid #222;white-space:nowrap;overflow:hidden;font-size:12px;font-weight:bold}
        .con{padding:20px;max-width:480px;margin:0 auto}
        .card{background:linear-gradient(135deg,#2b323b,#1c2026);padding:25px;border-radius:20px;margin-bottom:20px;border:1px solid #333}
        .btn{width:48%;padding:15px;border-radius:12px;border:none;font-weight:bold;cursor:pointer}
        .btn-y{background:#f0b90b} .btn-g{background:#2c333e;color:white;border:1px solid #333}
        .row{display:flex;justify-content:space-between;margin-bottom:10px}
        .stat{background:#1c2026;padding:15px;border-radius:15px;width:48%;box-sizing:border-box}
        .logo-wrap{background:black;padding:20px 0;overflow:hidden;white-space:nowrap}
        .logo{height:35px;margin:0 20px;filter:brightness(0) invert(1);opacity:0.7;vertical-align:middle}
        .tx-item{background:#181b21;padding:15px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
        .modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);align-items:flex-end;justify-content:center}
        .m-con{background:#1c2026;width:100%;max-width:500px;padding:30px;border-radius:24px 24px 0 0}
        input,select{width:100%;padding:15px;background:#0b0e11;border:1px solid #333;color:white;margin:10px 0;border-radius:8px;box-sizing:border-box}
    </style></head><body>
    <div class="tick">BTC $98,420 &nbsp;&nbsp; ETH $3,150 &nbsp;&nbsp; XRP $1.12 &nbsp;&nbsp; USDT $1.00</div>
    <div class="con">
        <div class="row"><h3>Hi User</h3><a href="/logout" style="color:red">Logout</a></div>
        ${u.pendingDeposit ? `<div style="background:#e67e22;padding:10px;border-radius:10px;margin-bottom:20px;color:black"><b>Pending: $${u.pendingDeposit.amount}</b> <a href="/pay-now" style="color:white">PAY NOW</a></div>` : ''}
        
        <div class="card">
            <div style="color:#888;font-size:12px">Total Assets</div>
            <div style="font-size:32px;font-weight:bold">$${(u.balance+u.lockedCapital+u.lockedProfit).toFixed(2)}</div>
            <div class="row" style="margin-top:20px;border-top:1px solid #444;padding-top:10px">
                <div><small>CASH</small><br><b style="color:#00c853">$${u.balance.toFixed(2)}</b></div>
                <div style="text-align:right"><small>LOCKED</small><br><b>$${u.lockedCapital.toFixed(2)}</b></div>
            </div>
        </div>

        <div class="row">
            <button class="btn btn-y" onclick="openM('dep')">DEPOSIT</button>
            <button class="btn btn-g" onclick="openM('with')">WITHDRAW</button>
        </div>

        <div class="row">
            <div class="stat"><small>Pending Yield</small><br><b style="color:#f0b90b">$${u.lockedProfit}</b><br><small style="font-size:9px">Releases in 30 Days</small></div>
            <div class="stat"><small>Earned</small><br><b style="color:#00c853">$${u.balance}</b></div>
        </div>

        <h3>History</h3>
        ${u.transactions.slice().reverse().map(t => `<div class="tx-item"><div><b>${t.type}</b><br><small style="color:#666">${t.details||t.date}</small></div><b>$${t.amount}</b></div>`).join('')}
    </div>

    <div class="logo-wrap"><marquee scrollamount="5">${logos} ${logos}</marquee></div>

    <div id="dep" class="modal"><div class="m-con">
        <h3>Deposit (Locked 30 Days)</h3><form action="/dep" method="POST">
        <input type="number" name="amount" placeholder="Amount" required><button class="btn btn-y" style="width:100%">PROCEED</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#666">Close</button>
    </div></div>

    <div id="with" class="modal"><div class="m-con">
        <h3>Withdraw Cash ($${u.balance})</h3><form action="/with" method="POST">
        <input type="number" name="amount" placeholder="Amount" max="${u.balance}" required>
        <select name="type"><option value="std">Standard (48h) - Free</option><option value="inst">Instant - 3% Fee</option></select>
        <input placeholder="Bank Name" required><input placeholder="Account No" required>
        <button class="btn btn-y" style="width:100%">SUBMIT</button></form>
        <br><button onclick="closeM()" style="background:none;border:none;color:#666">Close</button>
    </div></div>

    <script>
    function openM(id){document.getElementById(id).style.display='flex'}
    function closeM(){document.querySelectorAll('.modal').forEach(e=>e.style.display='none')}
    </script>
    </body></html>`);
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
    res.send(`<body style="background:#0f1216;color:white;font-family:sans-serif;padding:20px;text-align:center">
    <h1 style="color:#f0b90b">$${u.pendingDeposit.amount}</h1>
    <div style="background:#1c2026;padding:20px;margin:10px 0;border-radius:10px">
    <b>US:</b> Bank of America | 026009593<br><br><b>EU:</b> Barclay | GB33BARC20658259151311<br><br><b>Bitcoin:</b> bc1qn4ajq8fppd3derk8a24w75jkk94pjynn063gm7
    </div>
    <form action="/sent" method="POST"><button style="padding:15px;width:100%;background:#00c853;border:none;font-weight:bold;cursor:pointer">I SENT PAYMENT</button></form>
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
