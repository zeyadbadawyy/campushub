import {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  getConversation,
  sendMessage,
  updateTypingStatus,
  getTypingStatus,
  getUserProfile,
  getOnlineStatus
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";


function Chat() {

  const { id } =
    useParams();

  const navigate = 
    useNavigate();

  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    content,
    setContent
  ] = useState("");

  const [
    chatUser,
    setChatUser
  ] = useState(null);

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const bottomRef =
    useRef(null);


  const typingTimeout =
    useRef(null);

  const [
    isTyping,
    setIsTyping
  ] = useState(false);

  const [
    isOnline,
    setIsOnline
  ] = useState(false);

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  async function loadMessages() {

    try {

      const data =
        await getConversation(
          id
        );

      setMessages(
        data || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function handleSend() {

    if (!content.trim())
      return;

    try {

      const response =
        await sendMessage(
          id,
          content
        );
      
      setMessages(
        (prev) => [
          ...prev,
          response
        ]
      );

      setContent("");

      updateTypingStatus(
        id,
        false
      );

      const typingData =
        await getTypingStatus(
          id
        );

      setIsTyping(
        typingData.is_typing
      );

    } catch (error) {

      console.error(error);

    }

  }

  useEffect(() => {

    loadMessages();

    async function loadTyping() {

      try {

        const typingData =
          await getTypingStatus(
            id
          );

        setIsTyping(
          typingData.is_typing
        );

      } catch (error) {

        console.error(error);

      }

    }

    loadTyping();

    const typingInterval =
      setInterval(
        loadTyping,
        1000
      );

    return () => {

      clearInterval(
        typingInterval
      );

    };

  }, [id]);

  useEffect(() => {

    async function loadUser() {

      try {

        const user =
          await getCurrentUser();

        setCurrentUser(
          user
        );

      } catch (error) {

        console.error(error);

      }

    }

    loadUser();

  }, []);

  useEffect(() => {

    async function loadChatUser() {

      try {

        const user =
          await getUserProfile(
            id
          );

        setChatUser(
          user
        );

      } catch (error) {

        console.error(error);

      }

    }

    loadChatUser();

  }, [id]);

  useEffect(() => {

    async function loadStatus() {

      try {

        const data =
          await getOnlineStatus(id);

        setIsOnline(
          data.online
        );

      } catch (error) {

        console.error(error);

      }

    }

    loadStatus();

  }, [id]);

  function getLastSeen(
    lastSeen,
    showOnlineStatus
  )
  {
    if (!showOnlineStatus)
      return "offline";

    if (!lastSeen)
      return "offline";

    const now =
      new Date();

    const time =
      new Date(lastSeen);

    const diff =
      Math.floor(
        (now - time) / 1000
      );

    if (diff < 120)
      return "● Online";

    if (diff < 3600)
      return `Last seen ${Math.floor(diff / 60)}m ago`;

    if (diff < 86400)
      return `Last seen ${Math.floor(diff / 3600)}h ago`;

    return `Last seen ${Math.floor(diff / 86400)}d ago`;
  }

  return (

    <MainLayout>

      <div className="chat-page">

        <div 
          className="chat-header"
          onClick={() =>
            navigate(`/profile/${id}`)
          }
        >

          <div className="chat-avatar">

            {
              chatUser?.name?.charAt(0)
            }

          </div>

          <div className="chat-user-details">

            <h2>

              {
                chatUser?.name
              }

            </h2>

            <p>

              {
                isOnline
                  ? <span>online</span>
                  : getLastSeen(
                      chatUser?.last_seen,
                      chatUser?.show_online_status
                    )
              }

            </p>

          </div>

          <div className="chat-header-arrow">
            ›
          </div>

        </div>

        <div className="chat-messages">

          {messages.length === 0 ? (

            <div className="empty-state">

              <h3>
                No messages yet
              </h3>

              <p>
                Start the conversation.
              </p>

            </div>

          ) : (

            messages.map(
              (message) => {

                const isMine =
                  currentUser?.id ===
                  message.sender_id;

                return (

                  <div
                    key={message.id}
                    className={
                      isMine
                        ? "message-row mine"
                        : "message-row"
                    }
                  >

                    <div className="message-wrapper">

                      <div
                        className={
                          isMine
                            ? "message-bubble mine"
                            : "message-bubble"
                        }
                      >

                        {message.content}

                      </div>

                      <div className="message-meta">

                        <span className="message-time">

                          {
                            new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit"
                              }
                            )
                          }

                        </span>

                        {
                          isMine && (

                            <span
                              className={
                                message.is_read
                                  ? "message-checks seen"
                                  : "message-checks"
                              }
                            >
                              ✔✔
                            </span>

                          )
                        }

                      </div>
                    </div>

                  </div>

                );

              }
            )

          )}

          {
            isTyping && (

              <div className="typing-container">

                <div className="typing-bubble">

                  <span></span>
                  <span></span>
                  <span></span>

                </div>

                <p className="typing-text">
                  {currentUser?.name} is typing...
                </p>

              </div>

            )
          }

          <div ref={bottomRef} />

        </div>


        <div className="chat-input-area">

          <textarea
            value={content}
            onChange={(e) => {

              setContent(
                e.target.value
              );

              updateTypingStatus(
                id,
                true
              );

              clearTimeout(
                typingTimeout.current
              );

              typingTimeout.current =
                setTimeout(() => {

                  updateTypingStatus(
                    id,
                    false
                  );

                }, 2000);

            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                if (content.trim()) {
                  handleSend();
                }
              }
            }}
            placeholder="Type a message..."
          />

          <button
            onClick={handleSend}
            className="send-btn"
          >
            ➤
          </button>

        </div>


      </div>

    </MainLayout>

  );

}

export default Chat;