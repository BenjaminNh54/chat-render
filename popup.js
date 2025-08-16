// ===== CONFIGURATION =====
const SERVER_IP = "chat-i4wn.onrender.com"; // Domaine Render public
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

let ws;
let reconnectTimeout;

function connectWS() {
  const wsUrl = `wss://${SERVER_IP}`;
  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      addMessage({ pseudo: 'Système', text: '✅ Connecté au serveur.' });
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
      addMessage({ pseudo: 'Système', text: '❌ Impossible de se connecter au serveur.' });
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
  const date = msg.created_at ? new Date(msg.created_at) : new Date();

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

  const div = document.createElement('div');
  div.innerHTML = `<strong>${escapeHTML(msg.pseudo)} :</strong> ${escapeHTML(msg.text)} <span style="color:gray;font-size:0.8em;">(${formattedDate})</span>`;

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
