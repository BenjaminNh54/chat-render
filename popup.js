const SERVER_IP = "chat-i4wn.onrender.com"; // Ton domaine Render
const SERVER_PORT = 443;

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
  const wsUrl = `wss://${SERVER_IP}`;
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
  if (e.key === 'Enter') { sendBtn.click(); e.preventDefault(); }
});

function addMessage(msg) {
  const div = document.createElement('div');

  let formattedDate = '';
  if (msg.created_at) {
    const date = new Date(msg.created_at);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth()+1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2,'0');
    const minutes = String(date.getMinutes()).padStart(2,'0');
    formattedDate = ` <span class="message-date">(${day}/${month}/${year} ${hours}:${minutes})</span>`;
  }

  div.innerHTML = `<strong>${escapeHTML(msg.pseudo)} :</strong> ${escapeHTML(msg.text)}${formattedDate}`;

  if (msg.pseudo === pseudo) div.classList.add('message-expediteur');

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
