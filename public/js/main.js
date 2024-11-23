const API_URL = "http://localhost:3000";

async function loadMyChats() {
  try {
    const response = await fetch(`${API_URL}/chat/my`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const chats = await response.json();

    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    chats.forEach((chat) => {
      const chatElement = document.createElement("div");
      chatElement.className = "chat-item";
      chatElement.innerHTML = `
                <h3>${chat.name || "Chat #" + chat.id}</h3>
                <button onclick="joinChat('${chat.id}')">Join</button>
            `;
      chatList.appendChild(chatElement);
    });
  } catch (error) {
    console.error("Error loading chats:", error);
  }
}

document.getElementById("createChatBtn").addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_URL}/chat/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      loadMyChats();
    }
  } catch (error) {
    console.error("Error creating chat:", error);
  }
});

function joinChat(chatId) {
  window.location.href = `/chat/${chatId}`;
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
});

loadMyChats();
