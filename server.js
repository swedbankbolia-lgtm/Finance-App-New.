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

// ==========================================
//  🟢 PARTNER LOGOS (Direct Wiki Links)
//  These links point directly to Wikimedia.
// ==========================================
const partners = [
    { 
        name: "Standard Chartered", 
        link: "https://www.sc.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/3/36/Standard_Chartered.svg" 
    },
    { 
        name: "Bank of America", 
        link: "https://www.bankofamerica.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/2/23/Bank_of_America_logo.svg" 
    },
    { 
        name: "BNY Mellon", 
        link: "https://www.bnymellon.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/f/f4/BNY_Mellon_logo.svg" 
    },
    { 
        name: "Citibank", 
        link: "https://www.citigroup.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Citi.svg" 
    },
    { 
        name: "BNP Paribas", 
        link: "https://mabanque.bnpparibas", 
        img: "https://upload.wikimedia.org/wikipedia/commons/1/12/BNP_Paribas.svg" 
    },
    { 
        name: "Morgan Stanley", 
        link: "https://www.morganstanley.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg" 
    },
    { 
        name: "JPMorgan Chase", 
        link: "https://www.jpmorganchase.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/d/d7/JPMorgan_Chase_logo_2008.svg" 
    },
    { 
        name: "Goldman Sachs", 
        link: "https://www.goldmansachs.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Goldman_Sachs.svg" 
    },
    { 
        name: "MUFG", 
        link: "https://www.mufg.jp", 
        img: "https://upload.wikimedia.org/wikipedia/commons/a/a2/MUFG_logo.svg" 
    },
    { 
        name: "Investec", 
        link: "https://www.investec.com", 
        img: "https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Investec_Bank_Logo.svg/1200px-Investec_Bank_Logo.svg.png" 
    },
    { 
        name: "Revolut", 
        link: "https://www.revolut.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/6/62/Revolut_logo.svg" 
    },
    { 
        name: "Bunq", 
        link: "https://www.bunq.com", 
        img: "https://upload.wikimedia.org/wikipedia/commons/c/bc/Bunq_logo.svg" 
    }
];

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
        
        // FINANCIAL CORE
        balance: 0,           // AVAILABLE CASH (Can withdraw this)
        lockedCapital: 1000,  // DEPOSIT (Locked, generates yield)
        lockedProfit: 200,    // YIELD (Locked until Day 30)
        maturityDate: "2/1/2026", // Visual date for the user
        agtTokens: 1000,      // Assets
        
        isAdmin: false,
        transactions: [
            { type: "Vault Deposit", amount: 1000, date: "1/1/2026", details: "Capital Locked" },
            { type: "20% Yield (Pending)", amount: 200, date: "1/1/2026", details: "Releases Feb 1" }
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
        .box{background:#1c2026;padding:40px;border-radius:24px;width:100%;max-width:350px;box-shadow:0 20px 50px rgba(0,0,0,0.5)}
        input{width:100%;padding:16px;margin:10px 0;background:#0b0e11;border:1px solid #333;color:white;border-radius:12px;font-size:16px;box-sizing:border-box}
        button{width:100%;padding:16px;background:linear-gradient(135deg, #f0b90b, #d9a300);border:none;font-weight:bold;border-radius:12px;cursor:pointer;margin-top:15px;color:#000;font-size:16px}
        </style></head><body><div class="box"><h2 style="color:#f0b90b;text-align:center">BlezzyPay</h2><p style="color:#666;text-align:center;font-size:14px;margin-bottom:30px">Secure Finance Portal</p>
        <form action="/login" method="POST"><input type="email" name="email" placeholder="Email" required><input type="password" name="passcode" placeholder="Passcode" required>
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

    const totalPortfolio = user.balance + user.lockedCapital + user.lockedProfit;

    // GENERATE LOGO HTML FROM CONFIG
    const logoHTML = partners.map(p => 
        `<a href="${p.link}" target="_blank" class="partner-item">
            <img src="${p.img}" class="partner-logo" title="${p.name}">
         </a>`
    ).join('');

    res.send(`
        <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root { --primary: #f0b90b; --bg: #0f1216; --card: #1c2026; }
            body{background:var(--bg);color:white;font-family:'Inter',sans-serif;margin:0;padding-bottom:100px}
            .ticker-wrap{width:100%;overflow:hidden;background:#16191f;border-bottom:1px solid #222;padding:12px 0}
            .ticker{display:flex;white-space:nowrap;animation:ticker 30s linear infinite}
            .ticker-item{padding:0 30px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px}
            .up{color:#00c853} .down{color:#ff3d00}
            @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
            
            .container { padding: 24px; max-width: 480px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .logout-btn { color: #ff4757; text-decoration: none; font-size: 13px; font-weight: 600; background: rgba(255, 71, 87, 0.1); padding: 8px 16px; border-radius: 20px; }

            .portfolio-card { background: linear-gradient(135deg, #2b323b 0%, #1c2026 100%); border-radius: 24px; padding: 25px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); }
            .portfolio-value { font-size: 38px; font-weight: 700; color: #fff; letter-spacing: -1px; }
            .agt-tag { position: absolute; top: 25px; right: 25px; background: rgba(240, 185, 11, 0.2); color: var(--primary); padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }

            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
            .btn-action { border: none; padding: 18px; border-radius: 18px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; color: white; }
            .btn-deposit { background: var(--primary); color: #000; }
            .btn-withdraw { background: #2c333e; border: 1px solid #3a424e; }

            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #1c2026; padding: 15px; border-radius: 16px; border: 1px solid #333; }
            .stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
            .stat-val { font-size: 18px; font-weight: 700; }
            .gold { color: #f0b90b; } .green { color: #00c853; }

            .tx-list { display: flex; flex-direction: column; gap: 12px; }
            .tx-item { display: flex; justify-content: space-between; align-items: center; background: #181b21; padding: 16px; border-radius: 16px; }
            .tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 12px; }
            .icon-dep { background: rgba(0, 200, 83, 0.15); color: #00c853; }
            .icon-lock { background: rgba(240, 185, 11, 0.15); color: var(--primary); }
            .icon-with { background: rgba(255, 61, 0, 0.15); color: #ff3d00; }

            .footer-partners { margin-top: 40px; border-top: 1px solid #222; padding-top: 20px; overflow: hidden; background: #000; }
            .logo-slider { display: flex; width: 400%; animation: scroll 60s linear infinite; }
            .logo-track { display: flex; align-items: center; justify-content: space-around; width: 25%; }
            
            /* UPDATED LOGO CSS */
            .partner-logo { 
                height: 40px; 
                width: auto;
                margin: 0 30px; 
                /* MAGIC FILTER: TURNS BLACK LOGOS WHITE */
                filter: brightness(0) invert(1); 
                opacity: 0.7; 
                transition: 0.3s; 
                display: block;
            }
            .partner-logo:hover { opacity: 1; transform: scale(1.1); }
            
            .text-link { color: #666; font-size: 10px; font-weight: 700; text-decoration: none; border: 1px solid #333; padding: 5px 10px; border-radius: 5px; margin: 0 10px; white-space: nowrap; }
            .text-link:hover { color: white; border-color:white; }
            
            @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-25%)}}

            /* Modal Styles */
            .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; align-items: flex-end; justify-content: center; backdrop-filter: blur(5px); }
            .modal-content { background: #1c2026; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 30px; animation: slideUp 0.3s ease; max-height: 85vh; overflow-y: auto; }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            
            .inp-group { margin-bottom: 15px; }
            .inp-label { display: block; color: #888; font-size: 12px; margin-bottom: 5px; }
            .inp-field { width: 100%; padding: 16px; background: #0f1216; border: 1px solid #333; color: white; border-radius: 12px; font-size: 16px; outline: none; box-sizing:border-box;}
            .btn-full { width: 100%; padding: 18px; background: var(--primary); color: black; font-weight: bold; border-radius: 12px; border: none; cursor: pointer; font-size: 16px; margin-top: 10px; }
            .close-modal { float:right; font-size: 24px; cursor: pointer; color: #666; }
            select.inp-field { appearance: none; cursor: pointer; }
            
            .wa-float { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-decoration: none; z-index: 100; transition: transform 0.2s;}
        </style></head><body>

        <div class="ticker-wrap"><div class="ticker">
            <div class="ticker-item">BTC <span class="up">$98,420</span></div><div class="ticker-item">ETH <span class="down">$3,150</span></div>
            <div class="ticker-item">XRP <span class="up">$1.12</span></div><div class="ticker-item">USDT <span class="up">$1.00</span></div>
            <div class="ticker-item">BTC <span class="up">$98,420</span></div><div class="ticker-item">ETH <span class="down">$3,150</span></div>
        </div></div>

        <div class="container">
            <div class="header">
                <div><h1 style="margin:0;font-size:20px">Hello, User</h1><p style="margin:0;font-size:12px;color:#888">BlezzyPay Premier</p></div>
                <a href="/logout" class="logout-btn"><i class="fa-solid fa-power-off"></i> Logout</a>
            </div>

            ${user.pendingDeposit ? `<div style="background:#e67e22;padding:15px;border-radius:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:13px;font-weight:600;color:black">Pending: $${user.pendingDeposit.amount}</div>
                <a href="/pay-now" style="background:white;color:#e67e22;padding:8px 12px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:bold">PAY NOW</a>
            </div>` : ''}

            <div class="portfolio-card">
                <div style="font-size:13px;color:#aaa;margin-bottom:5px">Total Asset Value</div>
                <div class="portfolio-value">$${totalPortfolio.toFixed(2)}</div>
                <div class="agt-tag"><i class="fa-solid fa-coins"></i> ${user.agtTokens} AGT</div>
                
                <div style="margin-top:20px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between;">
                    <div>
                        <div style="font-size:11px;color:#888">AVAILABLE (To Withdraw)</div>
                        <div style="font-size:16px;color:#00c853;font-weight:bold">$${user.balance.toFixed(2)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:11px;color:#888">LOCKED (Capital)</div>
                        <div style="font-size:16px;color:white;font-weight:bold">$${user.lockedCapital.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div class="actions">
                <button class="btn-action btn-deposit" onclick="openModal('deposit')"><i class="fa-solid fa-arrow-down"></i> DEPOSIT</button>
                <button class="btn-action btn-withdraw" onclick="openModal('withdraw')"><i class="fa-solid fa-paper-plane"></i> WITHDRAW</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label"><i class="fa-solid fa-lock"></i> Pending 20% Yield</div>
                    <div class="stat-val gold">$${user.lockedProfit.toFixed(2)}</div>
                    <div style="font-size:10px;color:#666;margin-top:5px">Matures: ${user.maturityDate || "Pending"}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label"><i class="fa-solid fa-sack-dollar"></i> Released Profit</div>
                    <div class="stat-val green">$${(user.balance).toFixed(2)}</div>
                </div>
            </div>

            <h3 style="font-size:16px;margin-bottom:15px">Smart History</h3>
            <div class="tx-list">
                ${user.transactions.slice().reverse().map(t => {
                    let icon = "icon-dep"; let fa = "fa-arrow-down"; let col = "white";
                    let displayAmount = t.amount;
                    if(t.type.includes("Withdraw")) { icon = "icon-with"; fa = "fa-arrow-up"; }
                    if(t.type.includes("Payout") || t.type.includes("Bonus") || t.type.includes("Yield")) { icon = "icon-lock"; fa = "fa-percentage"; col = "green"; }
                    
                    return `
                    <div class="tx-item">
                        <div style="display:flex;align-items:center;">
                            <div class="tx-icon ${icon}"><i class="fa-solid ${fa}"></i></div>
                            <div><div style="font-weight:600;font-size:14px">${t.type}</div>
                            <div style="font-size:11px;color:#666">${t.details || t.date}</div></div>
                        </div>
                        <div style="font-weight:700;color:${col}">${displayAmount < 0 ? '' : '+'}$${displayAmount}</div>
                    </div>`;
                }).join('')}
            </div>

            <div class="footer-partners">
                <div style="text-align:center;color:#444;font-size:10px;text-transform:uppercase;margin-bottom:15px;font-weight:bold">Trusted by Global Leaders</div>
                <div class="logo-slider">
                    
                    <div class="logo-track">
                        ${logoHTML}
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-link">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-link">ARMONIE BANK SA</a>
                    </div>
                    <div class="logo-track">
                        ${logoHTML}
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-link">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-link">ARMONIE BANK SA</a>
                    </div>
                    <div class="logo-track">
                        ${logoHTML}
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-link">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-link">ARMONIE BANK SA</a>
                    </div>
                    <div class="logo-track">
                        ${logoHTML}
                        <a href="https://www.bancomoc.mz" target="_blank" class="text-link">BANCO DE MOÇAMBIQUE</a>
                        <a href="#" class="text-link">ARMONIE BANK SA</a>
                    </div>

                </div>
            </div>
        </div>

        <div id="depositModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModals()">&times;</span>
                <h2>Deposit to Smart Vault</h2>
                <p style="font-size:12px;color:#888;margin-bottom:20px">Capital Locked for 30 Days. Earn 20%.</p>
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
                    Available Cash: <strong style="color:#00c853">$${user.balance.toFixed(2)}</strong>
                </div>
                <form action="/withdraw" method="POST">
                    <div class="inp-group">
                        <span class="inp-label">Withdrawal Amount</span>
                        <input type="number" name="amount" class="inp-field" placeholder="0.00" required max="${user.balance}">
                    </div>
                    
                    <div class="inp-group">
                        <span class="inp-label">Payout Speed</span>
                        <select name="payoutType" class="inp-field" style="color:#f0b90b; font-weight:bold;">
                            <option value="standard">Standard (48 Hours) - FREE</option>
                            <option value="instant">⚡ Instant Payout - 3% Fee</option>
                        </select>
                    </div>
                    
                    <h3 style="font-size:14px; color:#f0b90b; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px;">Bank Details</h3>
                    
                    <div class="inp-group">
                        <span class="inp-label">Bank Name</span>
                        <input type="text" name="bankName" class="inp-field" placeholder="e.g. Barclays" required>
                    </div>
                    <div class="inp-group">
                        <span class="inp-label">Account Holder Name</span>
                        <input type="text" name="accName" class="inp-field" placeholder="Full Name" required>
                    </div>
                    <div class="inp-group">
                        <span class="inp-label">Account Number / IBAN</span>
                        <input type="text" name="accNum" class="inp-field" placeholder="XXXX-XXXX-XXXX" required>
                    </div>

                    <button class="btn-full" style="background:#fff; color:black">SUBMIT WITHDRAWAL</button>
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

// WITHDRAWAL LOGIC (Instant 3% vs Standard Free)
