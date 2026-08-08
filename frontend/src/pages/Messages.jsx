import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  getConversations,
  searchUsersForChats
} from "../services/postService";



function Messages() {

  const [
    conversations,
    setConversations
  ] = useState([]);

  const [
    showSearch,
    setShowSearch
  ] = useState(false);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    users,
    setUsers
  ] = useState([]);

  const avatarColors = [
    "#4f46e5",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#ec4899"
  ];

  useEffect(() => {

    async function loadData() {

      try {

        const data =
          await getConversations();

        setConversations(data);

      } catch (error) {

        console.error(error);

      }

    }

    loadData();

    const interval =
      setInterval(
        loadData,
        5000
      );

    return () =>
      clearInterval(
        interval
      );

  }, []);

  useEffect(() => {

    async function loadUsers() {

      if (!search.trim()) {

        setUsers([]);

        return;

      }

      try {

        const data =
          await searchUsersForChats(
            search
          );

        setUsers(
          data || []
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    loadUsers();

  }, [search]);

  function formatTime(date) {

    const now =
      new Date();

    const time =
      new Date(date);

    const diff =
      Math.floor(
        (now - time) / 1000
      );

    if (diff < 60)
      return "Just now";

    if (diff < 3600)
      return `${Math.floor(diff / 60)}m ago`;

    if (diff < 86400)
      return `${Math.floor(diff / 3600)}h ago`;

    return time.toLocaleDateString();

  }

  function truncateMessage(text) {

    if (!text)
      return "";

    if (text.length <= 40)
      return text;

    return text.slice(0, 40) + "...";
  }

  return (

    <MainLayout>

      <div className="messages-page">

        <div className="messages-header">

          <h1>
            Messages
          </h1>

          <button
            className="new-chat-btn"
            onClick={() =>
              setShowSearch(
                !showSearch
              )
            }
          >
            + New Chat
          </button>

        </div>

        {
          showSearch && (

            <div className="new-chat-search">

              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

              <div className="search-users-list">
                {
                  users.length === 0 &&
                  search && (

                    <div className="search-empty">

                      No users found

                    </div>

                  )
                }
                
                {users.map(
                  (user) => (

                    <Link
                      key={user.id}
                      to={`/messages/${user.id}`}
                      className="search-user-card"
                    >

                      <div
                        className="avatar"
                        style={{
                          background:
                            avatarColors[
                              user.id %
                              avatarColors.length
                            ]
                        }}
                      >

                        {
                          user.name?.charAt(0)
                        }

                      </div>

                      <div className="search-user-info">

                        <strong>

                          {user.name}

                        </strong>

                        <span>

                          {
                            user.faculty ||
                            "CampusHub User"
                          }

                        </span>

                      </div>

                    </Link>

                  )
                )}

              </div>

            </div>

          )
        }

        <div className="conversation-list">

          {
            conversations.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No conversations yet
                </h3>

                <p>
                  Start chatting with
                  other students.
                </p>

                <button
                  className="new-chat-btn"
                  onClick={() =>
                    setShowSearch(true)
                  }
                >
                  Start New Chat
                </button>

              </div>

            ) : (

              conversations.map(
                (user) => (

                  <Link
                    key={user.user_id}
                    to={`/messages/${user.user_id}`}
                    className={
                      user.unread_count > 0
                        ? "conversation-card unread"
                        : "conversation-card"
                    }
                  >

                    <div className="avatar">

                      {
                        user.name?.charAt(0)
                      }

                    </div>

                    <div className="conversation-content">

                      <div className="conversation-top">

                        <strong>
                          {user.name}
                        </strong>

                        <div className="conversation-meta">

                          {
                            user.unread_count > 0 && (

                              <span className="unread-badge">

                                {user.unread_count}

                              </span>

                            )
                          }

                          <span className="conversation-time">

                            {
                              formatTime(
                                user.last_message_time
                              )
                            }

                          </span>

                        </div>

                      </div>

                      <p className="conversation-preview">

                        {truncateMessage(user.last_message)}

                      </p>

                    </div>

                  </Link>

                )
              )

            )
          }

        </div>

      </div>

    </MainLayout>

  );

}

export default Messages;