const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

// Création d'un serveur HTTP basique
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Serveur de chat en ligne via Render");
});

// Création du serveur WebSocket lié au serveur HTTP
const wss = new WebSocket.Server({ server });

// Chargement des messages depuis un fichier
let messages = [];
try {
  messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
} catch {
  messages = [];
}

wss.on("connection", (ws) => {
  console.log("Nouvelle connexion WebSocket");

  // Envoi de l'historique des messages au nouveau client
  messages.forEach((msg) => {
    ws.send(JSON.stringify(msg));
  });

  // Réception des messages
  ws.on("message", (message) => {
    try {
      const msgObj = JSON.parse(message.toString());
      messages.push(msgObj);

      // Sauvegarde dans un fichier
      fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));

      // Diffusion à tous les clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msgObj));
        }
      });
    } catch (err) {
      console.error("Erreur de traitement du message :", err);
    }
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

// Render fournit automatiquement HTTPS et WSS sur son domaine
server.listen(process.env.PORT || 8080, () => {
  console.log(`Serveur WebSocket lancé sur le port ${process.env.PORT || 8080}`);
});
