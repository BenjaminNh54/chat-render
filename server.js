const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

// Créer le serveur HTTP simple
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Serveur Chat Local en ligne");
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Historique des messages
let messages = [];
try {
  messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
} catch (e) {
  messages = [];
}

// Gestion des connexions
wss.on("connection", (ws) => {
  console.log("Un utilisateur s'est connecté");

  // Envoyer l'historique au nouvel utilisateur
  messages.forEach((msg) => ws.send(JSON.stringify(msg)));

  ws.on("message", (message) => {
    try {
      const msgObj = JSON.parse(message.toString());
      messages.push(msgObj);

      // Sauvegarder l'historique
      fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

      // Diffuser à tous les clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(msgObj));
      });
    } catch (e) {
      console.error("Erreur parsing message:", e);
    }
  });

  ws.on("close", () => console.log("Un utilisateur s'est déconnecté"));
});

// Render fournit le port via process.env.PORT
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
