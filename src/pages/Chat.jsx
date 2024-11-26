import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import "../styles/Chat.css";
import instance from "../config/axios";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { socket, isConnected } = useWebSocket("ws://localhost:3000");

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      console.log("Received message:", data);
      if (currentChat && data.chatId === currentChat.id) {
        setMessages((prev) => [...prev, data.userMessage, data.aiMessage]);
      }
    };

    const handleJoinedChat = (data) => {
      console.log("Joined chat:", data);
      if (data.messages) {
        setMessages(data.messages);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleReceiveMessage);
    socket.on("joined_chat", handleJoinedChat);
    socket.on("error", (error) => console.error("Server error:", error));

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
      socket.off("joined_chat");
      socket.off("error");
    };
  }, [socket, currentChat]);

  const loadChats = async () => {
    try {
      const response = await instance.get("/chats/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      console.log("Loaded chats:", response.data);
      setChats(response.data);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const createNewChat = async () => {
    try {
      const response = await instance.post(
        "/chats/create",
        { name: "New Chat" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      console.log("Created new chat:", response.data);
      setChats((prevChats) => [...prevChats, response.data]);
      handleChatSelect(response.data);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleChatSelect = useCallback(
    (chat) => {
      console.log("Selecting chat:", chat.id);
      setCurrentChat(chat);

      if (socket && isConnected) {
        console.log("Emitting join_chat event for:", chat.id);
        socket.emit("join_chat", { chatId: chat.id });
      } else {
        console.error("Cannot join chat - socket not connected");
      }
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(() => {
    if (!message.trim() || !currentChat || !socket || !isConnected) {
      console.log("Cannot send message:", {
        messageEmpty: !message.trim(),
        noCurrentChat: !currentChat,
        socketNotConnected: !socket || !isConnected,
      });
      return;
    }

    const messageData = {
      chatId: currentChat.id,
      message: message.trim(),
    };
    console.log(messageData);

    console.log("Sending message:", messageData);
    socket.emit("send_message", messageData);

    setMessages((prev) => [
      ...prev,
      {
        content: message.trim(),
        sender: "user",
        createdAt: new Date().toISOString(),
      },
    ]);

    setMessage("");
  }, [message, currentChat, socket, isConnected]);

  return (
    <div className="chat-container">
      <div className="sidebar">
        <button onClick={createNewChat} className="new-chat-btn">
          New Chat
        </button>
        <div className="connection-status">
          Status: {isConnected ? "Connected" : "Disconnected"}
        </div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`chat-item ${
                currentChat?.id === chat.id ? "active" : ""
              }`}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-area">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === "user" ? "user" : "ai"}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="message-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="input"
            disabled={!isConnected || !currentChat}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !currentChat}
            className="send-btn"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
