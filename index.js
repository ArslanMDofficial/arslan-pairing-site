const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const PAIR_DB = path.join(__dirname, "pairings.json");

// Initialize JSON DB
if (!fs.existsSync(PAIR_DB)) {
  fs.writeJsonSync(PAIR_DB, { pairings: {} });
}

// 🔐 Generate Random 8-Char Code
function generateCode() {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code.match(/.{1,4}/g).join("-"); // e.g., AB12-CD34
}

// 1️⃣ Generate Pairing Code (POST /generate-code)
app.post("/generate-code", async (req, res) => {
  const { number } = req.body;

  if (!number || !/^\d{10,15}$/.test(number)) {
    return res.status(400).json({ success: false, message: "❌ Invalid number" });
  }

  const db = await fs.readJson(PAIR_DB);

  const code = generateCode();
  db.pairings[code] = {
    number,
    session_id: `session_${number}`,
    used: false,
  };

  await fs.writeJson(PAIR_DB, db, { spaces: 2 });

  return res.json({ success: true, code });
});

// 2️⃣ Pair With Code (POST /pair)
app.post("/pair", async (req, res) => {
  const { pairing_code } = req.body;

  if (!pairing_code) {
    return res.status(400).json({ success: false, message: "❌ Pairing code required" });
  }

  const db = await fs.readJson(PAIR_DB);
  const entry = db.pairings[pairing_code];

  if (!entry) {
    return res.status(404).json({ success: false, message: "❌ Invalid or expired code" });
  }

  if (entry.used) {
    return res.status(403).json({ success: false, message: "⚠️ This code has already been used." });
  }

  // Mark as used
  db.pairings[pairing_code].used = true;
  await fs.writeJson(PAIR_DB, db, { spaces: 2 });

  return res.json({ success: true, session_id: entry.session_id });
});

// ✅ Status Route
app.get("/", (req, res) => {
  res.send("✅ Arslan-MD Pairing API is Running");
});

app.listen(PORT, () => {
  console.log(`✅ Arslan-MD Pairing API running on http://localhost:${PORT}`);
});
