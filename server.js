// server.js
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const http = require('http');

// ===== CONFIG SUPABASE =====
const supabaseUrl = 'https://osqzuptinfbahmfncjgl.supabase.co';
const supabaseKey = 'sb_secret_b4tZZmSvmT-vze7BvvNzhQ_zJFULUxt'; // Remplace par ta clé anonyme
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
    ws.send(JSON.stringify({ pseudo: msg.user, text: msg.message }));
  });

  // Réception d'un nouveau message
  ws.on('message', async (message) => {
    try {
      const msgObj = JSON.parse(message.toString());

      // Sauvegarder dans Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([{ user: msgObj.pseudo, message: msgObj.text }]);

      if (error) {
        console.error('Erreur insertion message:', error);
        return;
      }

            // Ajouter la date exacte renvoyée par Supabase
      const fullMsg = {
        pseudo: data[0].user,
        text: data[0].message,
        created_at: data[0].created_at
      };

      // Diffuser à tous les clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msgObj));
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
