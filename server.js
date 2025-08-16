const WebSocket = require("ws");
const fs = require("fs");
const http = require("http");

// Création du serveur HTTP (obligatoire pour Render)
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Historique des messages
let messages = [];
try {
  messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
} catch {
  messages = [];
}

// Quand un client se connecte
wss.on("connection", (ws) => {
  console.log("Nouvelle connexion WebSocket");

  // Envoie des messages actuels
  messages.forEach((msg) => {
    ws.send(msg.text);
  });

  // Réception d'un message
  ws.on("message", (message) => {
    const msgObj = {
      text: message.toString(),
      date: Date.now(),
    };
    messages.push(msgObj);

    // Sauvegarde dans le fichier
    fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
    messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));

    // Diffusion à tous
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgObj.text);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

// Toutes les 10 secondes : vider le chat puis renvoyer tous les messages
/*setInterval(() => {
  try {
    messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
  } catch {
    messages = [];
  }

  // Envoyer un signal "clear" pour vider le chat
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("__CLEAR_CHAT__");
    }
  });

  // Puis renvoyer chaque message un par un
  setTimeout(() => {
    messages.forEach((msg) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg.text);
        }
      });
    });
  }, 100); // petit délai pour que le client ait vidé son chat
}, 10000);*/

// Ping toutes les 5 min pour éviter la mise en veille de Render
setInterval(() => {
  http.get(`http://localhost:${process.env.PORT || 8080}`);
}, 5 * 60 * 1000);

// Lancement du serveur
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
