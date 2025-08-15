const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${protocol}//${location.host}`);

socket.addEventListener("message", (event) => {
    const messages = document.getElementById("messages");
    const msg = document.createElement("div");
    msg.textContent = event.data;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
});

function sendMessage() {
    const input = document.getElementById("msg");
    if (input.value.trim()) {
        socket.send(input.value);
        input.value = "";
    }
}
