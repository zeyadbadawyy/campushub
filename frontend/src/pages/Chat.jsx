import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  ArrowLeft,
  Image as ImageIcon,
  Smile,
  Send,
  X,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  VolumeX,
  Volume2,
  UserRound,
} from "lucide-react";

import EmojiPicker from "emoji-picker-react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import Avatar from "../components/Avatar";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

import MainLayout from "../layouts/MainLayout";

import {
  getConversation,
  sendMessage,
  getUserProfile,
  uploadChatImage,
} from "../services/postService";

import {
  getCurrentUser,
} from "../services/auth";

function Chat() {
  const {
    socket,
    typingUsers,
    readReceipts,
    onlineUsers,
    lastSeenUsers,
  } = useWebSocket();

  const { id } = useParams();

  const navigate = useNavigate();

  const [messages, setMessages] =
    useState([]);

  const [content, setContent] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [showImage, setShowImage] =
    useState(null);

  const [chatUser, setChatUser] =
    useState(null);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [isTyping, setIsTyping] =
    useState(false);

  const [isOnline, setIsOnline] =
    useState(false);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const bottomRef =
    useRef(null);

  const pickerRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const typingTimeout =
    useRef(null);

  const [showChatMenu, setShowChatMenu] =
    useState(false);

  const {
    messages: wsMessages,
  } = useWebSocket();

  const [, forceUpdate] =
    useState(0);

  useEffect(() => {
    const interval =
      setInterval(() => {
        forceUpdate(
          (prev) => prev + 1
        );
      }, 60000);

    return () =>
      clearInterval(interval);
  }, []);

  function openProfile() {
    setShowChatMenu(false);
    navigate(`/profile/${id}`);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages,
    isTyping,
  ]);

  async function loadMessages() {
    try {
      const data =
        await getConversation(id);

      setMessages(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSend() {
    if (
      !content.trim() &&
      !image
    ) {
      return;
    }

    try {
      let imageUrl = "";

      if (image) {
        const upload =
          await uploadChatImage(image);

        imageUrl = upload.url;
      }

      const response =
        await sendMessage(
          id,
          content,
          imageUrl
        );

      setMessages((prev) => [
        ...prev,
        response,
      ]);

      setContent("");

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setImage(null);
      setImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setShowEmojiPicker(false);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const user =
          await getCurrentUser();

        setCurrentUser(user);
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
          await getUserProfile(id);

        setChatUser(user);
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
      latestMessage.sender_id ===
        Number(id) ||
      latestMessage.receiver_id ===
        Number(id);

    if (!belongsToThisChat) {
      return;
    }

    setMessages((prev) => {
      const exists =
        prev.some(
          (msg) =>
            msg.id ===
            latestMessage.id
        );

      if (exists) {
        return prev;
      }

      return [
        ...prev,
        latestMessage,
      ];
    });

    if (
      latestMessage.sender_id ===
      Number(id)
    ) {
      loadMessages();
    }
  }, [
    wsMessages,
    id,
  ]);

  useEffect(() => {
    setIsOnline(
      onlineUsers.includes(
        Number(id)
      )
    );
  }, [
    onlineUsers,
    id,
  ]);

  useEffect(() => {
    setIsTyping(
      typingUsers.includes(
        Number(id)
      )
    );
  }, [
    typingUsers,
    id,
  ]);

  useEffect(() => {
    function handleClickOutside(
      event
    ) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target
        )
      ) {
        setShowEmojiPicker(
          false
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(
          typingTimeout.current
        );
      }

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  function getLastSeen(
    lastSeen,
    showOnlineStatus
  ) {
    if (!showOnlineStatus) {
      return "Offline";
    }

    if (!lastSeen) {
      return "Offline";
    }

    const now =
      new Date();

    const time =
      new Date(lastSeen);

    const diff =
      Math.floor(
        (now - time) / 1000
      );

    if (diff < 60) {
      return "Last seen just now";
    }

    if (diff < 3600) {
      return `Last seen ${Math.floor(
        diff / 60
      )}m ago`;
    }

    if (diff < 86400) {
      return `Last seen ${Math.floor(
        diff / 3600
      )}h ago`;
    }

    return `Last seen ${Math.floor(
      diff / 86400
    )}d ago`;
  }

  function handleEmojiClick(
    emojiData
  ) {
    setContent(
      (prev) =>
        prev + emojiData.emoji
    );
  }

  function handleImageSelect(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  function handleTyping(
    event
  ) {
    const value =
      event.target.value;

    setContent(value);

    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "typing",
          targetUserId:
            Number(id),
        })
      );
    }

    if (typingTimeout.current) {
      clearTimeout(
        typingTimeout.current
      );
    }

    typingTimeout.current =
      setTimeout(() => {
        // WebSocket typing state is handled
        // by the existing backend context.
      }, 800);
  }

  const readUntil =
    readReceipts[
      Number(id)
    ] || 0;

  return (
    <MainLayout>
      <div className="
        mx-auto
        flex
        h-[calc(100vh-8rem)]
        w-full
        max-w-5xl
        min-h-[500px]
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-slate-200/80
        bg-white
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      ">

        {/* Header */}

        <motion.div
          initial={{
            opacity: 0,
            y: -6,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            flex
            shrink-0
            items-center
            gap-3
            border-b
            border-slate-100
            bg-white/95
            px-4 py-3
            backdrop-blur-xl
            dark:border-slate-800
            dark:bg-slate-900/95
            sm:px-5
          "
        >
          <button
            type="button"
            onClick={() =>
              navigate("/messages")
            }
            className="
              flex h-10 w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
              dark:hover:bg-slate-800
              dark:hover:text-white
              sm:hidden
            "
          >
            <ArrowLeft size={19} />
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/profile/${id}`
              )
            }
            className="
              flex min-w-0
              flex-1
              items-center
              gap-3
              text-left
            "
          >
            <div className="
              relative shrink-0
            ">
              <Avatar
                user={chatUser}
                size="md"
              />

              {isOnline && (
                <span className="
                  absolute
                  bottom-0
                  right-0
                  h-3
                  w-3
                  rounded-full
                  border-2
                  border-white
                  bg-emerald-500
                  dark:border-slate-900
                " />
              )}
            </div>

            <div className="
              min-w-0
              flex-1
            ">
              <h2 className="
                truncate
                text-sm
                font-semibold
              ">
                {chatUser?.name ||
                  "Loading..."}
              </h2>

              <p className="
                mt-0.5
                truncate
                text-xs
                text-slate-500
                dark:text-slate-400
              ">
                {isOnline
                  ? "Online"
                  : getLastSeen(
                      lastSeenUsers[id] ||
                        chatUser?.last_seen,
                      chatUser?.show_online_status
                    )}
              </p>
            </div>

            <ChevronRight
              size={18}
              className="
                shrink-0
                text-slate-300
                dark:text-slate-600
              "
            />
          </button>


          {/* meatballs menu button for mute,search in convo, and view profile*/}


          {/* <button
            type="button"
            className="
              flex h-10 w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              dark:hover:bg-slate-800
              dark:hover:text-white
            "
          >
            <MoreHorizontal
              size={19}
            />
          </button> */}


          
        </motion.div>

        {/* Messages */}

        <div className="
          flex-1
          overflow-y-auto
          bg-slate-50/60
          px-4 py-5
          dark:bg-slate-950/40
          sm:px-6
        ">
          {messages.length === 0 ? (
            <div className="
              flex h-full
              min-h-[360px]
              items-center
              justify-center
            ">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="
                  text-center
                "
              >
                <div className="
                  mx-auto
                  flex h-14 w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white
                  text-indigo-500
                  shadow-sm
                  dark:bg-slate-900
                ">
                  <MessageCircle
                    size={25}
                  />
                </div>

                <h3 className="
                  mt-4
                  text-sm
                  font-semibold
                ">
                  Start the conversation
                </h3>

                <p className="
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                ">
                  Send a message to{" "}
                  {chatUser?.name ||
                    "this student"}.
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="
              mx-auto
              flex
              max-w-3xl
              flex-col
              gap-3
            ">
              {messages.map(
                (message) => {
                  const isMine =
                    currentUser?.id ===
                    message.sender_id;

                  const isSeen =
                    message.id <=
                    readUntil;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{
                        opacity: 0,
                        y: 6,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className={`
                        flex
                        ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }
                      `}
                    >
                      <div className={`
                        flex
                        max-w-[85%]
                        flex-col
                        ${
                          isMine
                            ? "items-end"
                            : "items-start"
                        }
                      `}>

                        {/* Bubble */}

                        <div
                          className={`
                            overflow-hidden
                            rounded-2xl
                            px-4 py-3
                            shadow-sm
                            ${
                              message.image_url &&
                              !message.content
                                ? `
                                  border
                                  border-slate-200
                                  bg-white
                                  p-1
                                  dark:border-slate-800
                                  dark:bg-slate-900
                                `
                                : isMine
                                ? `
                                  rounded-br-md
                                  bg-indigo-600
                                  text-white
                                `
                                : `
                                  rounded-bl-md
                                  border
                                  border-slate-200
                                  bg-white
                                  text-slate-800
                                  dark:border-slate-800
                                  dark:bg-slate-900
                                  dark:text-slate-100
                                `
                            }
                          `}
                        >
                          {message.content && (
                            <p className="
                              whitespace-pre-wrap
                              break-words
                              text-sm
                              leading-6
                            ">
                              {
                                message.content
                              }
                            </p>
                          )}

                          {message.image_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowImage(
                                  message.image_url
                                )
                              }
                              className="
                                block
                                overflow-hidden
                                rounded-xl
                              "
                            >
                              <img
                                src={
                                  message.image_url
                                }
                                alt=""
                                className="
                                  h-auto
                                  max-h-[240px]
                                  max-w-[240px]
                                  rounded-xl
                                  object-cover
                                  transition
                                  hover:scale-[1.01]
                                  sm:max-h-[280px]
                                  sm:max-w-[280px]
                                "
                              />
                            </button>
                          )}
                        </div>

                        {/* Meta */}

                        <div className="
                          mt-1.5
                          flex items-center
                          gap-1.5
                          px-1
                        ">
                          <span className="
                            text-[10px]
                            text-slate-400
                          ">
                            {new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </span>

                          {isMine && (
                            <span
                              className={`
                                text-[10px]
                                ${
                                  message.is_read ||
                                  isSeen
                                    ? `
                                      text-indigo-500
                                      dark:text-indigo-400
                                    `
                                    : `
                                      text-slate-400
                                    `
                                }
                              `}
                            >
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              )}

              {/* Typing */}

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: 6,
                    }}
                    className="
                      flex
                      items-end
                      gap-2
                    "
                  >
                    <div className="
                      flex
                      items-center
                      gap-1
                      rounded-2xl
                      rounded-bl-md
                      border
                      border-slate-200
                      bg-white
                      px-4 py-3
                      dark:border-slate-800
                      dark:bg-slate-900
                    ">
                      <span className="
                        h-1.5 w-1.5
                        animate-bounce
                        rounded-full
                        bg-slate-400
                      " />

                      <span
                        className="
                          h-1.5 w-1.5
                          animate-bounce
                          rounded-full
                          bg-slate-400
                        "
                        style={{
                          animationDelay:
                            "120ms",
                        }}
                      />

                      <span
                        className="
                          h-1.5 w-1.5
                          animate-bounce
                          rounded-full
                          bg-slate-400
                        "
                        style={{
                          animationDelay:
                            "240ms",
                        }}
                      />
                    </div>

                    <span className="
                      mb-1
                      text-[10px]
                      text-slate-400
                    ">
                      {chatUser?.name}
                      {" "}
                      is typing...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Image fullscreen */}

        <AnimatePresence>
          {showImage && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setShowImage(null)
              }
              className="
                fixed inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-slate-950/80
                p-4
                backdrop-blur-md
              "
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  relative
                  max-h-[92vh]
                  max-w-[95vw]
                "
              >
                <img
                  src={showImage}
                  alt=""
                  className="
                    max-h-[92vh]
                    max-w-[95vw]
                    rounded-2xl
                    object-contain
                    shadow-2xl
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowImage(null)
                  }
                  className="
                    absolute
                    right-3
                    top-3
                    flex h-10 w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-black/60
                    text-white
                    backdrop-blur-md
                    transition
                    hover:bg-black/80
                  "
                >
                  <X size={18} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image preview */}

        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 8,
              }}
              className="
                shrink-0
                border-t
                border-slate-100
                bg-white
                px-4 py-3
                dark:border-slate-800
                dark:bg-slate-900
                sm:px-5
              "
            >
              <div className="
                relative
                w-fit
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                dark:border-slate-700
              ">
                <img
                  src={imagePreview}
                  alt=""
                  className="
                    h-24
                    w-24
                    object-cover
                  "
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="
                    absolute
                    right-1.5
                    top-1.5
                    flex h-7 w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-black/60
                    text-white
                    backdrop-blur-sm
                  "
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}

        <div className="
          relative
          shrink-0
          border-t
          border-slate-100
          bg-white
          p-3
          dark:border-slate-800
          dark:bg-slate-900
          sm:p-4
        ">
          <div className="
            mx-auto
            flex
            max-w-3xl
            items-end
            gap-2
          ">

            {/* Image */}

            <input
              ref={fileInputRef}
              hidden
              id="chat-image"
              type="file"
              accept="image/*"
              onChange={
                handleImageSelect
              }
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-slate-400
                transition
                hover:bg-indigo-50
                hover:text-indigo-600
                dark:hover:bg-indigo-500/10
                dark:hover:text-indigo-400
              "
            >
              <ImageIcon size={19} />
            </button>

            {/* Emoji */}

            <div
              ref={pickerRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setShowEmojiPicker(
                    (prev) => !prev
                  )
                }
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:bg-amber-50
                  hover:text-amber-600
                  dark:hover:bg-amber-500/10
                  dark:hover:text-amber-400
                "
              >
                <Smile size={19} />
              </button>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    className="
                      absolute
                      bottom-12
                      left-0
                      z-50
                      overflow-hidden
                      rounded-2xl
                      shadow-2xl
                    "
                  >
                    <EmojiPicker
                      theme="auto"
                      onEmojiClick={
                        handleEmojiClick
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}

            <textarea
              value={content}
              onChange={
                handleTyping
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                    "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();

                  if (
                    content.trim() ||
                    image
                  ) {
                    handleSend();
                  }
                }
              }}
              placeholder="Write a message..."
              rows={1}
              className="
                max-h-32
                min-h-10
                flex-1
                resize-none
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-4 py-2.5
                text-sm
                leading-5
                outline-none
                transition
                focus:border-indigo-500
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-500/10
                dark:border-slate-700
                dark:bg-slate-950
                dark:focus:bg-slate-950
              "
            />

            {/* Send */}

            <button
              type="button"
              onClick={handleSend}
              disabled={
                !content.trim() &&
                !image
              }
              className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-600
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Chat;