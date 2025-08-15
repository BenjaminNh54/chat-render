// server.js pour Render avec WSS et historique des messages
const express = require("express");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();

// Servir un message simple pour vérifier que le serveur est en ligne
app.get("/", (req, res) => {
  res.send("Serveur Chat Local en ligne");
});

// Crée le serveur HTTP
const server = http.createServer(app);

// WebSocket
const wss = new WebSocket.Server({ server });

// Historique des messages
let messages = [];

// Charger l'historique si le fichier existe
const historyFile = path.join(__dirname, "messages.json");
if (fs.existsSync(historyFile)) {
  try {
    messages = JSON.parse(fs.readFileSync(historyFile, "utf8"));
  } catch (e) {
    messages = [];
  }
}

wss.on("connection", (ws) => {
  console.log("Un utilisateur s'est connecté");

  // Envoyer l'historique au nouvel utilisateur
  messages.forEach((msg) => ws.send(JSON.stringify(msg)));

  ws.on("message", (message) => {
    try {
      const msgObj = JSON.parse(message.toString());
      messages.push(msgObj);

      // Sauvegarder l'historique
      fs.writeFileSync(historyFile, JSON.stringify(messages, null, 2));

      // Diffuser à tous les clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msgObj));
        }
      });
    } catch (e) {
      console.error("Erreur parsing message:", e);
    }
  });

  ws.on("close", () => {
    console.log("Un utilisateur s'est déconnecté");
  });
});

// Render définit automatiquement le PORT via process.env.PORT
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur https://ton-domaine-on-render.onrender.com`);
});
