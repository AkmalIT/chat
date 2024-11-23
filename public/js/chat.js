const API_URL = "http://localhost:3000";
const ws = new WebSocket("ws://localhost:3000");

const chatId = window.location.pathname.split("/").pop();
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: "joinchat",
      chatId: chatId,
      token: localStorage.getItem("token"),
    })
  );
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "message") {
    addMessage(data.message);
  }
};

function addMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.className = `message ${message.isBot ? "bot" : "user"}`;
  messageElement.textContent = message.content;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();

  if (message) {
    ws.send(
      JSON.stringify({
        type: "send_message",
        chatId: chatId,
        message: message,
      })
    );
    input.value = "";
  }
});
