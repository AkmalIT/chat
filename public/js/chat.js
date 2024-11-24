const socket = io("/socket.io", {
  query: { token: localStorage.getItem("accessToken") },
});

socket.on("connected", (data) => {
  console.log(data.message);
});

socket.on("receive_message", (message) => {
  const messagesDiv = document.getElementById("messages");
  const newMessage = document.createElement("div");
  newMessage.textContent = `${message.sender}: ${message.content}`;
  messagesDiv.appendChild(newMessage);
});

document.getElementById("sendMessageForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = document.getElementById("messageInput").value;
  const chatId = window.location.pathname.split("/").pop();

  socket.emit("send_message", { chatId, message });
  document.getElementById("messageInput").value = "";
});
