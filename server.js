/*const http = require("http");
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
});*/




const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

// Charger l'historique depuis un fichier
let messages = [];
try {
  if (fs.existsSync("messages.json")) {
    messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
  }
} catch (err) {
  console.error("Erreur lors du chargement de l'historique :", err);
  messages = [];
}

// Créer le serveur HTTP simple
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Serveur de chat WebSocket actif");
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Gestion des connexions
wss.on("connection", (ws) => {
  console.log("Nouvelle connexion WebSocket");

  // Envoyer l'historique au nouvel utilisateur
  messages.forEach((msg) => ws.send(JSON.stringify(msg)));

  // Réception de messages
  ws.on("message", (message) => {
    try {
      const msgObj = JSON.parse(message.toString());
      messages.push(msgObj);

      // Sauvegarder dans un fichier
      fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));

      // Diffuser à tous les clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msgObj));
        }
      });
    } catch (err) {
      console.error("Erreur traitement message :", err);
    }
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

// Écouter le port défini par Render
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// OPTION : Ping toutes les 5 min pour éviter la mise en veille
setInterval(() => {
  fetch("https://TON-URL-RENDER.com")
    .then(() => console.log("Ping envoyé pour éviter la veille"))
    .catch(err => console.error("Erreur ping :", err));
}, 5 * 60 * 1000);

