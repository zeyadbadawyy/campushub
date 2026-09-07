import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Plus,
  Search,
  ChevronRight,
  Inbox,
  UserRound,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import {
  getConversations,
  searchUsersForChats,
} from "../services/postService";

import Avatar from "../components/Avatar";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

function Messages() {
  const [conversations, setConversations] =
    useState([]);

  const [showSearch, setShowSearch] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const { messages: wsMessages } =
    useWebSocket();

  useEffect(() => {
    async function loadData() {
      try {
        const data =
          await getConversations();

        setConversations(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data =
          await searchUsersForChats(search);

        setUsers(data || []);
      } catch (error) {
        console.error(error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!wsMessages.length) {
      return;
    }

    const latestMessage =
      wsMessages[wsMessages.length - 1];

    setConversations((prev) => {
      const existing = prev.find(
        (conversation) =>
          conversation.user_id ===
          latestMessage.sender_id
      );

      if (!existing) {
        return prev;
      }

      const updated = prev.map(
        (conversation) => {
          if (
            conversation.user_id !==
            latestMessage.sender_id
          ) {
            return conversation;
          }

          return {
            ...conversation,
            last_message:
              latestMessage.content,
            last_message_time:
              latestMessage.created_at,
            unread_count:
              conversation.unread_count + 1,
          };
        }
      );

      const updatedConversation =
        updated.find(
          (conversation) =>
            conversation.user_id ===
            latestMessage.sender_id
        );

      return [
        updatedConversation,
        ...updated.filter(
          (conversation) =>
            conversation.user_id !==
            latestMessage.sender_id
        ),
      ];
    });
  }, [wsMessages]);

  function formatTime(date) {
    if (!date) {
      return "";
    }

    const now = new Date();
    const time = new Date(date);

    const diff = Math.floor(
      (now - time) / 1000
    );

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)}m`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h`;
    }

    return time.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  function truncateMessage(text) {
    if (!text) {
      return "";
    }

    if (text.length <= 55) {
      return text;
    }

    return text.slice(0, 55) + "...";
  }

  function getConversationPreview(user) {
    if (user.image_url) {
      if (user.last_message) {
        return `📷 ${truncateMessage(
          user.last_message
        )}`;
      }

      return "📷 Image";
    }

    return truncateMessage(
      user.last_message
    );
  }

  return (
    <MainLayout>
      <div className="
        mx-auto
        w-full
        max-w-5xl
      ">

        {/* Header */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            mb-6
            flex flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div className="
            flex items-center gap-3
          ">
            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-500/10
              dark:text-indigo-400
            ">
              <MessageCircle
                size={21}
              />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Messages
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Stay connected with
                your campus community.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSearch(
                (prev) => !prev
              );

              setSearch("");

              setUsers([]);
            }}
            className="
              inline-flex
              w-fit
              items-center gap-2
              rounded-xl
              bg-indigo-600
              px-4 py-2.5
              text-sm font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-indigo-700
            "
          >
            <Plus size={17} />

            New Chat
          </button>
        </motion.div>

        {/* New chat search */}

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: -6,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -6,
              }}
              className="mb-5 overflow-hidden"
            >
              <div className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-200/80
                bg-white
                shadow-sm
                dark:border-slate-800
                dark:bg-slate-900
              ">
                <div className="
                  border-b
                  border-slate-100
                  p-4
                  dark:border-slate-800
                ">
                  <div className="
                    flex h-11
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    focus-within:border-indigo-500
                    focus-within:ring-4
                    focus-within:ring-indigo-500/10
                    dark:border-slate-700
                    dark:bg-slate-950
                  ">
                    <Search
                      size={18}
                      className="
                        shrink-0
                        text-slate-400
                      "
                    />

                    <input
                      type="text"
                      autoFocus
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      className="
                        min-w-0
                        flex-1
                        bg-transparent
                        text-sm
                        outline-none
                        placeholder:text-slate-400
                      "
                    />
                  </div>
                </div>

                <div className="
                  max-h-72
                  overflow-y-auto
                ">
                  {users.length > 0 ? (
                    users.map(
                      (user) => (
                        <Link
                          key={user.id}
                          to={`/messages/${user.id}`}
                          onClick={() => {
                            setShowSearch(false);
                            setSearch("");
                          }}
                          className="
                            flex items-center
                            gap-3 px-4 py-3
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-slate-800
                          "
                        >
                          <Avatar
                            user={user}
                            size="md"
                          />

                          <div className="
                            min-w-0 flex-1
                          ">
                            <p className="
                              truncate
                              text-sm
                              font-semibold
                            ">
                              {user.name}
                            </p>

                            <p className="
                              mt-0.5
                              truncate
                              text-xs
                              text-slate-500
                              dark:text-slate-400
                            ">
                              {user.faculty ||
                                "CampusHub User"}
                            </p>
                          </div>

                          <ChevronRight
                            size={17}
                            className="
                              shrink-0
                              text-slate-300
                            "
                          />
                        </Link>
                      )
                    )
                  ) : search ? (
                    <div className="
                      px-5 py-8
                      text-center
                    ">
                      <UserRound
                        size={22}
                        className="
                          mx-auto
                          text-slate-300
                          dark:text-slate-700
                        "
                      />

                      <p className="
                        mt-3
                        text-sm
                        font-medium
                      ">
                        No users found
                      </p>
                    </div>
                  ) : (
                    <div className="
                      px-5 py-8
                      text-center
                    ">
                      <p className="
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      ">
                        Search for someone
                        to start a conversation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation header */}

        {!loading &&
          conversations.length > 0 && (
            <div className="
              mb-3
              flex items-center
              justify-between
            ">
              <div className="
                flex items-center
                gap-2
              ">
                <Inbox
                  size={16}
                  className="
                    text-slate-400
                  "
                />

                <span className="
                  text-sm
                  font-semibold
                ">
                  Conversations
                </span>
              </div>

              <span className="
                text-xs
                text-slate-400
              ">
                {conversations.length}
              </span>
            </div>
          )}

        {/* Loading */}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-20
                    animate-pulse
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    dark:border-slate-800
                    dark:bg-slate-900
                  "
                />
              )
            )}
          </div>
        )}

        {/* Empty */}

        {!loading &&
          conversations.length === 0 && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                rounded-3xl
                border
                border-dashed
                border-slate-300
                bg-white
                px-6 py-20
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div className="
                mx-auto
                flex h-14 w-14
                items-center
                justify-center
                rounded-2xl
                bg-indigo-50
                text-indigo-600
                dark:bg-indigo-500/10
                dark:text-indigo-400
              ">
                <MessageCircle size={25} />
              </div>

              <h2 className="
                mt-4
                text-lg
                font-semibold
              ">
                No conversations yet
              </h2>

              <p className="
                mx-auto mt-2
                max-w-sm
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Start a conversation
                with another student.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowSearch(true)
                }
                className="
                  mt-5
                  inline-flex
                  items-center gap-2
                  rounded-xl
                  bg-indigo-600
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-indigo-700
                "
              >
                <Plus size={16} />
                Start New Chat
              </button>
            </motion.div>
          )}

        {/* Conversations */}

        {!loading &&
          conversations.length > 0 && (
            <div className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200/80
              bg-white
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            ">
              {conversations.map(
                (user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{
                      opacity: 0,
                      x: -8,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.2,
                      delay:
                        Math.min(
                          index * 0.03,
                          0.15
                        ),
                    }}
                  >
                    <Link
                      to={`/messages/${user.user_id}`}
                      className={`
                        group
                        flex
                        items-center
                        gap-3
                        px-4
                        py-4
                        transition-all
                        duration-200
                        hover:bg-slate-50
                        dark:hover:bg-slate-800/70
                        ${
                          index <
                          conversations.length - 1
                            ? `
                              border-b
                              border-slate-100
                              dark:border-slate-800
                            `
                            : ""
                        }
                        ${
                          user.unread_count > 0
                            ? `
                              bg-indigo-50/40
                              dark:bg-indigo-500/5
                            `
                            : ""
                        }
                      `}
                    >
                      {/* Avatar */}

                      <div className="
                        relative shrink-0
                      ">
                        <Avatar
                          user={{
                            id: user.user_id,
                            name: user.name,
                            avatar_url:
                              user.avatar_url,
                          }}
                          size="md"
                        />

                        {user.unread_count >
                          0 && (
                          <span className="
                            absolute
                            -right-0.5
                            -top-0.5
                            h-3
                            w-3
                            rounded-full
                            border-2
                            border-white
                            bg-indigo-600
                            dark:border-slate-900
                          " />
                        )}
                      </div>

                      {/* Content */}

                      <div className="
                        min-w-0 flex-1
                      ">
                        <div className="
                          flex items-center
                          justify-between
                          gap-3
                        ">
                          <p className="
                            truncate
                            text-sm
                            font-semibold
                          ">
                            {user.name}
                          </p>

                          <span className="
                            shrink-0
                            text-[11px]
                            text-slate-400
                          ">
                            {formatTime(
                              user.last_message_time
                            )}
                          </span>
                        </div>

                        <div className="
                          mt-1
                          flex items-center
                          justify-between
                          gap-3
                        ">
                          <p
                            className={`
                              min-w-0 truncate
                              text-sm
                              ${
                                user.unread_count >
                                0
                                  ? `
                                    font-medium
                                    text-slate-700
                                    dark:text-slate-200
                                  `
                                  : `
                                    text-slate-500
                                    dark:text-slate-400
                                  `
                              }
                            `}
                          >
                            {getConversationPreview(
                              user
                            )}
                          </p>

                          {user.unread_count >
                            0 && (
                            <span className="
                              flex
                              min-w-5
                              h-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-indigo-600
                              px-1.5
                              text-[10px]
                              font-bold
                              text-white
                            ">
                              {user.unread_count >
                              99
                                ? "99+"
                                : user.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={17}
                        className="
                          shrink-0
                          text-slate-300
                          transition
                          group-hover:translate-x-0.5
                          group-hover:text-indigo-500
                          dark:text-slate-600
                        "
                      />
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          )}
      </div>
    </MainLayout>
  );
}

export default Messages;