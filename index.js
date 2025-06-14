const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/pair", async (req, res) => {
    const { pairing_code, session_id } = req.body;

    if (!pairing_code || !session_id) {
        return res.status(400).json({ success: false, message: "Pairing code aur session_id lazmi hai." });
    }

    try {
        const sessionPath = path.join(__dirname, "sessions", session_id);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: false,
            browser: ['ArslanMD', 'Chrome', '1.0.0']
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, pairingCode } = update;
            if (pairingCode) {
                console.log("📲 Pair this code in WhatsApp:", pairingCode);
            }

            if (connection === "open") {
                console.log("✅ Paired successfully");
                return res.json({ success: true, session_id, message: "WhatsApp paired successfully!" });
            }
        });

        sock.ev.on("creds.update", saveCreds);

    } catch (err) {
        console.error("❌ Error pairing:", err);
        return res.status(500).json({ success: false, message: "Pairing failed", error: err.message });
    }
});

app.listen(3000, () => {
    console.log("🚀 Arslan-MD Pairing API running on http://localhost:3000");
});
