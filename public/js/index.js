document
  .getElementById("createChatForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const chatName = document.getElementById("chatName").value;

    const response = await fetch("/chats/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ name: chatName }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      alert("Error creating chat");
    }
  });
