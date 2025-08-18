// server.js
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const http = require('http');

// ===== CONFIG SUPABASE =====
const supabaseUrl = 'https://osqzuptinfbahmfncjgl.supabase.co';
const supabaseKey = 'sb_secret_b4tZZmSvmT-vze7BvvNzhQ_zJFULUxt'; // ta clé
const supabase = createClient(supabaseUrl, supabaseKey);
// ===========================

// Créer un serveur HTTP basique
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Serveur de chat en ligne via Render + Supabase");
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Fonction pour récupérer tous les messages depuis Supabase
async function getAllMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Erreur récupération messages:', error);
    return [];
  }
  return data;
}

// Gestion des connexions WebSocket
wss.on('connection', async (ws) => {
  console.log('Nouvelle connexion WebSocket');

  // Envoyer l'historique au nouvel utilisateur
  const messages = await getAllMessages();
  messages.forEach(msg => {
    ws.send(JSON.stringify({ pseudo: msg.user, text: msg.message, date: msg.created_at }));
  });

  // Réception d'un nouveau message
  ws.on('message', async (message) => {
    try {
      const msgObj = JSON.parse(message.toString());

      // Sauvegarder dans Supabase et récupérer created_at
      const { data, error } = await supabase
        .from('messages')
        .insert([{ user: msgObj.pseudo, message: msgObj.text }])
        .select();

      if (error) {
        console.error('Erreur insertion message:', error);
        return;
      }

      const savedMsg = data[0];

      // Diffuser à tous les clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            pseudo: savedMsg.user,
            text: savedMsg.message,
            date: savedMsg.created_at
          }));
        }
      });

    } catch (err) {
      console.error('Erreur traitement message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client déconnecté');
  });
});

// Render fournit le port via process.env.PORT
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Serveur WebSocket lancé sur le port ${PORT}`);
});

/*// ===== ANTI-SLEEP (Keep-Alive) =====
const RENDER_URL = "https://chat-i4wn.onrender.com"; // <-- remplace par ton URL publique Render

setInterval(() => {
  http.get(RENDER_URL, (res) => {
    console.log("Ping anti-sleep:", res.statusCode);
  }).on("error", (err) => {
    console.error("Erreur ping anti-sleep:", err.message);
  });
}, 2 * 60 * 1000); // toutes les 2 minutes
*/
