const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// 1. DATABASE CONNECTION
// This uses your Render Environment Variable or a local fallback
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finance_app_db';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. MIDDLEWARE
app.use(express.json());

// Serve static files (CSS, JS, Images) from the root and 'public' folder
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// 3. THE "ERROR-FREE" ROUTE
app.get('/', (req, res) => {
    // We define the two most likely places your file is located
    const rootIndex = path.join(__dirname, 'index.html');
    const publicIndex = path.join(__dirname, 'public', 'index.html');

    // Try finding it in the root first
    res.sendFile(rootIndex, (err) => {
        if (err) {
            // If not in root, try the public folder
            res.sendFile(publicIndex, (err2) => {
                if (err2) {
                    // If both fail, show a helpful diagnostic page
                    res.status(404).send(`
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h1>🚀 Finance App Server is Live!</h1>
                            <p style="color: red;"><strong>Status:</strong> HTML File Not Found.</p>
                            <p>The server is looking for <code>index.html</code> in these locations:</p>
                            <ul>
                                <li><code>${rootIndex}</code></li>
                                <li><code>${publicIndex}</code></li>
                            </ul>
                            <p><strong>Action:</strong> Ensure your file is named exactly <code>index.html</code> and is in your main GitHub folder.</p>
                        </div>
                    `);
                }
            });
        }
    });
});

// 4. PORT BINDING
// Render uses process.env.PORT. We use 3000 as a backup.
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server active on port ${PORT}`);
});
