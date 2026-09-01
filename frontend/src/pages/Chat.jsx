import {
  FaChevronRight,
  FaPaperPlane,
  FaImage,
  FaTimes
} from "react-icons/fa";

import {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import Avatar from "../components/Avatar";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

import MainLayout
  from "../layouts/MainLayout";

import {
  getConversation,
  sendMessage,
  getUserProfile,
  getOnlineStatus,
  uploadChatImage
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";


function Chat() {

  const {
    socket,
    typingUsers,
    readReceipts,
    onlineUsers,
    lastSeenUsers
  } = useWebSocket();

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

  const [image, setImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [showImage, setShowImage] =
    useState(null);

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

  const {
    messages: wsMessages
  } = useWebSocket();
  
  const [, forceUpdate] = useState(0);

  useEffect(() => {

    const interval =
      setInterval(() => {

        forceUpdate(
          prev => prev + 1
        );

      }, 60000);

    return () =>
      clearInterval(interval);

  }, []);

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages, isTyping]);

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

    if (
      !content.trim() &&
      !image
    )
      return;

    try {

      let imageUrl = "";

      if (image) {

        const upload =
          await uploadChatImage(
            image
          );

        imageUrl =
          upload.url;

      }

      const response =
        await sendMessage(
          id,
          content,
          imageUrl
        );
      
      setMessages(
        (prev) => [
          ...prev,
          response
        ]
      );

      setContent("");

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImage(null);
      setImagePreview("");

      const input =
        document.getElementById(
          "chat-image"
        );

      if (input) {
        input.value = "";
      }

    } catch (error) {

      console.error(error);

    }

  }

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

    loadMessages();

  }, [id]);

  useEffect(() => {

    if (!wsMessages.length) {
      return;
    }

    const latestMessage =
      wsMessages[
        wsMessages.length - 1
      ];

    const belongsToThisChat =
      latestMessage.sender_id === Number(id) ||
      latestMessage.receiver_id === Number(id);

    if (!belongsToThisChat) {
      return;
    }

    setMessages(
      (prev) => {

        const exists =
          prev.some(
            (msg) =>
              msg.id === latestMessage.id
          );

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          latestMessage
        ];

      }
    );

    if (
      latestMessage.sender_id === Number(id)
    ) {
      loadMessages();
    }

  }, [
    wsMessages,
    id
  ]);

  useEffect(() => {

    setIsOnline(
      onlineUsers.includes(
        Number(id)
      )
    );

  }, [
    onlineUsers,
    id
  ]);

  useEffect(() => {

    setIsTyping(
      typingUsers.includes(
        Number(id)
      )
    );

  }, [
    typingUsers,
    id
  ]);

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

    if (diff < 60)
      return "Last seen just now";

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

          <Avatar
            user={chatUser}
            size="md"
            className="avatar-chat"
          />

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
                      lastSeenUsers[id] || chatUser?.last_seen,
                      chatUser?.show_online_status
                    )
              }
            </p>

          </div>

          <div className="chat-header-arrow">
            <FaChevronRight />
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

                const readUntil =
                  readReceipts[
                    Number(id)
                  ] || 0;

                const isSeen =
                  message.id <= readUntil;
                  
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
                          message.image_url && !message.content
                            ? "message-bubble image-only"
                            : isMine
                              ? "message-bubble mine"
                              : "message-bubble"
                        }
                      >

                        <>
                          {
                            message.content && (
                              <p>
                                {message.content}
                              </p>
                            )
                          }

                          {
                            message.image_url && (

                              <img
                                src={message.image_url}
                                alt=""
                                className="chat-message-image"
                                onClick={() =>
                                  setShowImage(
                                    message.image_url
                                  )
                                }
                              />

                            )
                          }
                        </>

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
                                (message.is_read || isSeen)
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
                  {chatUser?.name} is typing...
                </p>

              </div>

            )
          }

          <div ref={bottomRef} />

        </div>

        {
          showImage && (

            <div
              className="image-modal"
              onClick={() =>
                setShowImage(null)
              }
            >

              <img
                src={showImage}
                alt=""
                className="image-modal-content"
              />

            </div>

          )
        }

        <div className="chat-input-area">
          <div className="chat-image-container">
            <input
              hidden
              id="chat-image"
              type="file"
              accept="image/*"
              onChange={(e) => {

                const file =
                  e.target.files[0];

                if (!file) return;

                setImage(file);

                if (imagePreview) {
                  URL.revokeObjectURL(
                    imagePreview
                  );
                }

                setImagePreview(
                  URL.createObjectURL(file)
                );

              }}
            />

            <label
              htmlFor="chat-image"
              className="chat-image-btn"
            >
              <FaImage />
            </label>

          </div>

          {
            imagePreview && (

              <div className="chat-preview">

                <img
                  src={imagePreview}
                  alt=""
                />

                <button
                  className="remove-image-btn"
                  onClick={() => {

                    if (imagePreview) {
                      URL.revokeObjectURL(imagePreview);
                    }

                    setImage(null);
                    setImagePreview("");

                    const input =
                      document.getElementById(
                        "chat-image"
                      );

                    if (input) {
                      input.value = "";
                    }

                  }}
                >
                  <FaTimes />
                </button>

              </div>

            )
          }

          <textarea
            value={content}
            onChange={(e) => {

              setContent(
                e.target.value
              );

              if (
                socket &&
                socket.readyState === WebSocket.OPEN
              ) {

                socket.send(
                  JSON.stringify({
                    type: "typing",
                    targetUserId: Number(id),
                  })
                );

              }

            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                if (
                  content.trim() ||
                  image
                ) {
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
            <FaPaperPlane />
          </button>

        </div>


      </div>

    </MainLayout>

  );

}

export default Chat;