const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// ⚙️ Server setup
const app = express();
const PORT = process.env.PORT || 3000;

// 🧠 Middleware
app.use(bodyParser.json());
app.use(cors());

// ✅ Sample / Pairing route
app.post('/pair', (req, res) => {
    const { pairing_code } = req.body;

    if (!pairing_code || pairing_code.length !== 9 && pairing_code.length !== 8) {
        return res.status(400).json({
            success: false,
            message: '❌ Invalid or missing pairing code'
        });
    }

    // 🧾 Simulated session generation
    const session_id = `session_${Date.now()}`;

    return res.json({
        success: true,
        pairing_code,
        session_id,
        message: '✅ Session created successfully. Use this ID in your bot.'
    });
});

// 🌐 Home route
app.get('/', (req, res) => {
    res.send(`
        <h2>✅ Arslan-MD Pairing API is Running</h2>
        <p>To generate a session, make a POST request to <code>/pair</code> with:</p>
        <pre>
{
  "pairing_code": "XXXX-YYYY"
}
        </pre>
        <p>You'll receive a session_id like <code>session_arslanmd</code>.</p>
    `);
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`🚀 Arslan-MD Pairing API running on http://localhost:${PORT}`);
});
