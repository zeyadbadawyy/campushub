import {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useParams
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  getConversation,
  sendMessage
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";


function Chat() {

  const { id } =
    useParams();

  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    content,
    setContent
  ] = useState("");

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const bottomRef =
    useRef(null);

  
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

      await sendMessage(
        id,
        content
      );

      setContent("");

      loadMessages();

    } catch (error) {

      console.error(error);

    }

  }

  useEffect(() => {

    loadMessages();

    const interval =
      setInterval(
        loadMessages,
        3000
      );

    return () =>
      clearInterval(
        interval
      );

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

  return (

    <MainLayout>

      <div className="chat-page">

        <h1 className="chat-header">
          Chat
        </h1>

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

                    </div>

                  </div>

                );

              }
            )

          )}

          <div ref={bottomRef} />

        </div>


        <div className="chat-input-area">

          <textarea
            value={content}
            onChange={(e) =>
              setContent(
                e.target.value
              )
              
            }
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