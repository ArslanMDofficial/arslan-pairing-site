const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const pairWithCode = require('./lib/pair');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Ensure sessions folder exists
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

app.post('/pair', async (req, res) => {
    const { pairing_code } = req.body;
    if (!pairing_code || pairing_code.length < 8) {
        return res.status(400).json({ success: false, message: "❌ Invalid pairing code" });
    }

    const session_id = `session_arslanmd_${Date.now()}`;

    try {
        const result = await pairWithCode(pairing_code, session_id);
        return res.status(200).json({
            success: true,
            message: "✅ WhatsApp paired successfully!",
            session_id: result
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Arslan-MD Pairing API running on http://localhost:${PORT}`);
});
