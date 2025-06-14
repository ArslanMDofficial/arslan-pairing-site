// lib/pair.js
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const pino = require("pino");

async function pairWithCode(pairingCode, session_id) {
    const sessionPath = path.join(__dirname, `../sessions/${session_id}.json`);
    const { state, saveState } = useSingleFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Arslan-MD API', 'Chrome', '1.0'],
    });

    try {
        await sock.ws.sendNode({
            tag: 'pair-device',
            attrs: { },
            content: [
                {
                    tag: 'code',
                    attrs: {},
                    content: Buffer.from(pairingCode)
                }
            ]
        });

        // Wait for connection
        return new Promise((resolve, reject) => {
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'open') {
                    resolve(session_id);
                } else if (connection === 'close') {
                    reject('❌ Failed to pair: ' + (lastDisconnect?.error?.message || 'Unknown error'));
                }
            });
        });
    } catch (err) {
        return Promise.reject("❌ Pairing failed: " + err.message);
    }
}

module.exports = pairWithCode;
