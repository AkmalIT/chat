import React, { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import "../styles/Chat.css";
import instance from "../config/axios";
import { useAuth } from "../context/AuthContent";


const ChatApp = () => {
  const [theme, setTheme] = useState("light"); 
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [newChatName, setNewChatName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { socket, isConnected } = useWebSocket("ws://localhost:3000");
  const { logout } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      console.log("Received message data:", data);

      if (currentChat && data.aiMessage) {
        setMessages((prev) => [
          ...prev,
          {
            ...data.aiMessage,
            sender: "ai",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleJoinedChat = (data) => {
      console.log("Joined chat data:", data);
      if (data.messages) {
        setMessages(data.messages);
      }
    };

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleReceiveMessage);
    socket.on("joined_chat", handleJoinedChat);
    socket.on("error", (error) => console.error("Server error:", error));

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleReceiveMessage);
      socket.off("joined_chat", handleJoinedChat);
      socket.off("error");
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket, currentChat]);

  const loadChats = async () => {
    try {
      const response = await instance.get("/chats/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setChats(response.data);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const createNewChat = async () => {
    if (!newChatName.trim()) {
      alert("Chat name cannot be empty");
      return;
    }

    try {
      const response = await instance.post(
        "/chats/create",
        { name: newChatName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setChats((prevChats) => [...prevChats, response.data]);
      handleChatSelect(response.data);
      setNewChatName("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleChatSelect = useCallback(
    (chat) => {
      setCurrentChat(chat);

      if (socket && isConnected) {
        socket.emit("join_chat", { chatId: chat.id });
      } else {
        console.error("Cannot join chat - socket not connected");
      }
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(() => {
    if (!message.trim() || !currentChat || !socket || !isConnected) {
      return;
    }

    const messageData = {
      chatId: currentChat.id,
      message: message.trim(),
    };

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

  const deleteChat = async (chatId) => {
    try {
      await instance.delete(`/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(theme)
  })

  return (
    <div className={`chat-container ${theme}`}>
      <div className="sidebar">
        <h2>ChatGPT</h2>
        <button onClick={toggleTheme} className="theme-toggle">
          Toggle {theme === "light" ? "Dark" : "Light"} Theme
        </button>
        <button onClick={() => setShowModal(true)} className="new-chat-btn">
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="delete-chat-btn"
              >
                <img src="/icons8-trash.svg" alt="delete icon" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="main-content">
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Chat</h3>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Enter chat name"
              className="modal-input"
            />
            <div className="modal-buttons">
              <button onClick={createNewChat} className="create-chat-btn">
                Create
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewChatName("");
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
