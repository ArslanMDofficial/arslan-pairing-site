const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const dotenv = require('dotenv');
const { default: makeWASocket, useMultiFileAuthState, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

dotenv.config();
const app = express();
app.use(express.json());

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// ✅ API route to generate session using 8-digit pairing code
app.post('/generate', async (req, res) => {
    const { pairing_code, session_id } = req.body;

    if (!pairing_code || !session_id)
        return res.status(400).json({ success: false, message: 'pairing_code aur session_id dono zaroori hain.' });

    const sessionPath = path.join(SESSIONS_DIR, session_id);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Arslan-MD', 'Chrome', '1.0.0']
    });

    // ✅ Handle pairing
    try {
        await sock.requestPairingCode(pairing_code);
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log('✅ WhatsApp connected using pairing code');
                return res.json({ success: true, session_id, message: 'Session created successfully!' });
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                return res.status(500).json({ success: false, message: 'Failed to connect.' });
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.log('❌ Pairing error:', err);
        return res.status(500).json({ success: false, message: 'Pairing failed!', error: err.message });
    }
});

// ✅ Check session exists
app.get('/check/:session_id', (req, res) => {
    const sessionPath = path.join(SESSIONS_DIR, req.params.session_id);
    if (fs.existsSync(sessionPath)) {
        return res.json({ success: true, message: 'Session exists.' });
    }
    return res.status(404).json({ success: false, message: 'Session not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Arslan-MD Pairing API running at http://localhost:${PORT}`);
});
