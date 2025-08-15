// ===== CONFIGURATION =====
const SERVER_IP = "d8cf1844d85f.ngrok-free.app "; // Mets ici l'IP locale de ton serveur
const SERVER_PORT = 443;           // Mets ici le port WebSocket
// =========================

let pseudo = localStorage.getItem('pseudo') || '';
const pseudoInput = document.getElementById('pseudo');
const setPseudoBtn = document.getElementById('setPseudo');
const editPseudoBtn = document.getElementById('editPseudo');
const chatBox = document.getElementById('chat');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');

pseudoInput.value = pseudo;
pseudoInput.disabled = !!pseudo;
setPseudoBtn.disabled = !!pseudo;
editPseudoBtn.disabled = !pseudo;

let ws;
let reconnectTimeout;

function connectWS() {
  const wsUrl = `wss://${SERVER_IP}${SERVER_PORT ? ':' + SERVER_PORT : ''}`;
  try {
    ws = new WebSocket(wsUrl);



    ws.onopen = () => {
      addMessage({ pseudo: 'Système', text: '✅ Connecté au serveur local.' });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        addMessage(msg);
      } catch (e) {
        console.error("Erreur parsing message:", e);
        addMessage({ pseudo: "Système", text: event.data });
      }
    };

    ws.onclose = () => {
      addMessage({ pseudo: 'Système', text: '⚠ Déconnecté. Tentative de reconnexion...' });
      reconnectTimeout = setTimeout(connectWS, 2000);
    };

    ws.onerror = () => {
      addMessage({ pseudo: 'Système', text: '❌ Impossible de se connecter au serveur local.' });
    };

  } catch (err) {
    addMessage({ pseudo: 'Système', text: '❌ Erreur de connexion : ' + err.message });
  }
}

connectWS();

setPseudoBtn.onclick = () => {
  pseudo = pseudoInput.value.trim() || 'Anonyme';
  localStorage.setItem('pseudo', pseudo);
  pseudoInput.disabled = true;
  setPseudoBtn.disabled = true;
  editPseudoBtn.disabled = false;
};

editPseudoBtn.onclick = () => {
  pseudoInput.disabled = false;
  setPseudoBtn.disabled = false;
  editPseudoBtn.disabled = true;
  pseudoInput.focus();
};

sendBtn.onclick = () => {
  const txt = msgInput.value.trim();
  if (txt && pseudo && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ pseudo, text: txt }));
    msgInput.value = '';
  }
};

msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
    e.preventDefault();
  }
});

function addMessage(msg) {
  const div = document.createElement('div');
  div.innerHTML = `<strong>${escapeHTML(msg.pseudo)} :</strong> ${escapeHTML(msg.text)}`;

  if (msg.pseudo === pseudo) {
    div.classList.add('message-expediteur');
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Petite fonction pour éviter injection HTML dans le chat
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escape[match];
  });
}
