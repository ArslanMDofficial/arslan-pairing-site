const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SESSIONS_DIR = "./sessions";

// Ensure sessions folder exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR);
}

// 🔁 POST: /generate
app.post("/generate", async (req, res) => {
  const { pairing_code, session_id } = req.body;

  if (!pairing_code || !session_id) {
    return res.status(400).json({ success: false, message: "pairing_code and session_id are required." });
  }

  const sessionPath = `${SESSIONS_DIR}/${session_id}`;
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
      },
    });

    await sock.ws.send(JSON.stringify({
      action: "pair-device",
      pairingCode: pairing_code
    }));

    sock.ev.on("connection.update", (update) => {
      const { connection } = update;
      if (connection === "open") {
        console.log(`✅ Session Created for ${session_id}`);
        return res.json({ success: true, session_id });
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (err) {
    console.error("❌ Pairing Error:", err);
    return res.status(500).json({ success: false, message: "Pairing failed!", error: err.message });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("🟢 Arslan-MD API is Live!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Arslan-MD Pairing API running on http://localhost:${PORT}`);
});
