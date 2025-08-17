// ===== CONFIGURATION =====
const SERVER_IP = "chat-i4wn.onrender.com"; // ton domaine Render
const SERVER_PORT = 443;                    // WSS par défaut pour HTTPS
// =========================

let pseudo = localStorage.getItem('pseudo') || '';
const pseudoInput = document.getElementById('pseudo');
const setPseudoBtn = document.getElementById('setPseudo');
const editPseudoBtn = document.getElementById('editPseudo');
const pseudoContainer = document.getElementById('pseudo-container'); // div parent du pseudo et bouton
const chatBox = document.getElementById('chat');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');

// Si l'utilisateur a déjà un pseudo, masquer complètement le champ et le bouton OK
if (pseudo) {
  pseudoContainer.style.display = 'none';
}

pseudoInput.value = pseudo;
pseudoInput.disabled = !!pseudo;
setPseudoBtn.disabled = !!pseudo;
editPseudoBtn.disabled = !pseudo;

let ws;
let reconnectTimeout;

function connectWS() {
  const wsUrl = `wss://${SERVER_IP}`;
  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => addMessage({ pseudo: 'Système', text: '✅ Connecté au serveur.' });

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
      addMessage({ pseudo: 'Système', text: '⚠ Déconnecté. Reconnexion...' });
      reconnectTimeout = setTimeout(connectWS, 2000);
    };

    ws.onerror = () => addMessage({ pseudo: 'Système', text: '❌ Impossible de se connecter.' });

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
  // Masquer le champ et le bouton OK après avoir choisi le pseudo
  pseudoContainer.style.display = 'none';
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

  let dateStr = '';
  if (msg.date) {
    const d = new Date(msg.date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    dateStr = ` [${day}\\${month}\\${year} ${hours}:${minutes}]`;
  }

  div.innerHTML = `<strong>${escapeHTML(msg.pseudo)} :</strong> ${escapeHTML(msg.text)}${dateStr}`;

  if (msg.pseudo === pseudo) div.classList.add('message-expediteur');

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Petite fonction pour éviter injection HTML
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const escape = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
    return escape[match];
  });
}
