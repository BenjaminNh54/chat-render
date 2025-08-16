// server.js
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const MESSAGES_FILE = "messages.json";

// Création du fichier s'il n'existe pas
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, "[]");
}

// Lire les messages
function readMessages() {
    try {
        return JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"));
    } catch {
        return [];
    }
}

// Sauvegarder les messages
function saveMessages(messages) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveur WebSocket actif.");
});

const wss = new WebSocket.Server({ server });

// Connexion WebSocket
wss.on("connection", (ws) => {
    console.log("Client connecté");

    // Envoyer l'historique au nouveau client
    ws.send(JSON.stringify({ type: "history", messages: readMessages() }));

    // Réception message
    ws.on("message", (message) => {
        let messages = readMessages();
        messages.push({ text: message.toString(), date: Date.now() });
        saveMessages(messages);

        // Diffuser à tous
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "message", text: message.toString(), date: Date.now() }));
            }
        });
    });

    ws.on("close", () => console.log("Client déconnecté"));
});

// Toutes les 10 sec → renvoyer l'historique complet
setInterval(() => {
    const messages = readMessages();
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "history", messages }));
        }
    });
}, 10000);

// Toutes les 5 min → requête vers soi-même (keep-alive)
setInterval(() => {
    http.get(SERVER_URL, (res) => {
        console.log("Ping keep-alive :", res.statusCode);
    }).on("error", (err) => {
        console.error("Erreur ping keep-alive :", err.message);
    });
}, 5 * 60 * 1000); // 5 minutes

server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Ping vers : ${SERVER_URL}`);
});
