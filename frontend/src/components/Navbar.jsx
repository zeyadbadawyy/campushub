import {
  FaBell,
  FaHeart,
  FaComment,
  FaUser,
  FaUserPlus,
  FaUserCheck,
  FaEnvelope,
  FaSearch
} from "react-icons/fa";


import { useEffect, useState, useRef } from "react";

import {
  useAuth
} from "../contexts/AuthContext";

import {
  useNavigate,
  Link
} from "react-router-dom";

import {
  searchUsers,
  getNotifications,
  markNotificationRead
} from "../services/postService";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

function Navbar() {

  const {
    notifications,
    notificationCount,
    setNotificationCount,
  } = useWebSocket();

  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();
  
  const [
    search,
    setSearch
  ] = useState("");

  const [
    results,
    setResults
  ] = useState([]);

  const searchRef =
    useRef(null);

  const notificationRef =
    useRef(null);

  const [
    showNotifications,
    setShowNotifications
  ] = useState(false);

  const [
    recentNotifications,
    setRecentNotifications
  ] = useState([]);

  const [
    showAccountMenu,
    setShowAccountMenu
  ] = useState(false);

  const accountMenuRef =
    useRef(null); 

  const avatarColors = [
    "#4f46e5",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#ec4899"
  ];

  useEffect(() => {

    async function performSearch() {

      if (!search.trim()) {

        setResults([]);

        return;

      }

      try {

        const cleanedSearch =
          search.replace(/\s+/g, "");

        const data =
          await searchUsers(
            cleanedSearch
          );

        setResults(
          data || []
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    performSearch();

  }, [search]);

  useEffect(() => {

    function handleClickOutside(
      event
    ) {

      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {

        setResults([]);
        setSearch("");
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {

        setShowNotifications(false);

      }

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(
          event.target
        )
      ) {

        setShowAccountMenu(false);

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

    if (!notifications.length) {
      return;
    }

    const newest =
      notifications[0];

    setRecentNotifications(
      prev => [
        newest,
        ...prev
      ].slice(0, 5)
    );

  }, [notifications]);

  function handleLogout() {

    logout();

    navigate(
      "/login"
    );

  }

  function handleSearch() {

    if (!search.trim())
      return;

    const query = search;

    setSearch("");
    setResults([]);

    navigate(`/search?q=${query}`);

  }

  async function loadNotificationsPreview() {

    try {

      const data =
        await getNotifications();

      setRecentNotifications(
        (data || []).slice(0, 5)
      );

    } catch (error) {

      console.error(error);

    }

  }
  
  function formatTime(dateString) {

    const date =
      new Date(dateString);

    const now =
      new Date();

    const diff =
      Math.floor(
        (now - date) / 1000
      );

    if (diff < 60)
      return "Just now";

    if (diff < 3600)
      return `${Math.floor(diff / 60)}m ago`;

    if (diff < 86400)
      return `${Math.floor(diff / 3600)}h ago`;

    return `${Math.floor(diff / 86400)}d ago`;

  }

  function getNotificationIcon(type) {

    switch (type) {

      case "follow":
        return <FaUser />;

      case "follow_request":
        return <FaUserPlus />;

      case "follow_accepted":
        return <FaUserCheck />;

      case "like":
        return <FaHeart />;

      case "comment":
        return <FaComment />;

      case "message":
        return <FaEnvelope />;

      default:
        return <FaBell />;
    }

  }

  function getNotificationRoute(
    notification
  ) {

    switch (
      notification.type
    ) {

      case "like":
        return `/posts/${notification.target_id}`;

      case "comment":
        return `/posts/${notification.target_id}`;

      case "message":
        return `/messages/${notification.sender_id}`;

      case "follow":
        return `/profile/${notification.sender_id}`;

      case "follow_request":
        return "/notifications";

      case "follow_accepted":
        return `/profile/${notification.sender_id}`;

      default:
        return "/";
    }

  }

  async function handleNotificationClick(
    notification
  ) {

    try {

      if (
        !notification.is_read
      ) {

        await markNotificationRead(
          notification.id
        );

        setNotificationCount(
          prev => Math.max(0, prev - 1)
        );

        setRecentNotifications(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      is_read: true
                    }
                  : item
            )
        );

      }

      navigate(
        getNotificationRoute(
          notification
        )
      );

    } catch (error) {

      console.error(error);

    }

  }

  return (

    <header className="navbar">

      <div>

        <h3>
          Welcome Back 👋
        </h3>

      </div>

      <div className="navbar-right">

        <div
          className="search-container"
          ref={searchRef}
        >

          <div className="search-box">

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  handleSearch();

                }

              }}
              className="search-input"
            />

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              <FaSearch />
            </button>

          </div>

          {search && (

            <div className="search-dropdown">

              {results?.length > 0 ? (

                results.map((user) => (

                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="search-result"
                  >

                    <div
                      className="search-avatar"
                      style={{
                        background:
                          avatarColors[
                            user.id %
                            avatarColors.length
                          ]
                      }}
                    >
                      {user.name?.charAt(0)}
                    </div>

                    <div className="search-user-info">

                      <strong>

                        {user.name}

                      </strong>

                      <span>

                        {user.faculty || "CampusHub User"}

                      </span>

                    </div>

                  </Link>

                ))

              ) : (

                <div className="search-empty">

                  <FaUser />

                  <p>
                    No users found
                  </p>

                </div>

              )}

            </div>

          )}

        </div>

        <div
          className="notification-wrapper"
          ref={notificationRef}
        >

          <div
            className="notification-icon"
            onClick={async () => {

              if (!showNotifications) {

                await loadNotificationsPreview();

              }

              setShowNotifications(
                !showNotifications
              );

            }}
          >

            <span className="notification-bell">

              <FaBell />

            </span>

            {notificationCount > 0 && (

              <span className="notification-badge">

                {notificationCount}

              </span>

            )}

          </div>

          {
            showNotifications && (

              <div className="notifications-dropdown">

                {
                  recentNotifications.length === 0 ? (

                    <div className="dropdown-empty">

                      <FaBell />
 
                      <p>
                        No notifications yet
                      </p>

                    </div>

                  ) : (

                    recentNotifications.map(
                      (notification) => (

                        <div
                          key={notification.id}
                          className={
                            notification.is_read
                              ? "dropdown-notification"
                              : "dropdown-notification unread"
                          }
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                        >

                          <div className="dropdown-notification-top">

                            <span className="avatar">

                              {
                                notification.sender_name?.charAt(0)
                              }

                            </span>
                             
                            <div className="dropdown-type-icon">

                              {
                                getNotificationIcon(
                                  notification.type
                                )
                              }

                            </div> 

                            {!notification.is_read && (

                              <span className="dropdown-dot">

                                ●

                              </span>

                            )}

                            <div>

                              <strong>

                                {
                                  notification.sender_name
                                }

                              </strong>

                              <p>

                                {
                                  notification.message
                                }

                              </p>

                              <small className="notification-time">

                                {
                                  formatTime(
                                    notification.created_at
                                  )
                                }

                              </small>

                            </div>

                          </div>

                        </div>

                      )
                    )

                  )
                }

                <button
                  className="view-all-btn"
                  onClick={() => {

                    setShowNotifications(false);

                    navigate("/notifications");

                  }}
                >

                  View All Notifications

                </button>

              </div>

            )
          }

        </div>

        <div
          className="account-menu"
          ref={accountMenuRef}
        >

          <button
            className="account-trigger"
            onClick={() =>
              setShowAccountMenu(
                !showAccountMenu
              )
            }
          >

            <div className="navbar-avatar">

              {user?.name?.charAt(0)}

            </div>

            <span>

              {user?.name}

            </span>

            <span>

              ▼

            </span>

          </button>

          {showAccountMenu && (

            <div className="account-dropdown">

              <button
                onClick={() =>
                  navigate(
                    `/profile/${user.id}`
                  )
                }
              >
                My Profile
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/edit-profile"
                  )
                }
              >
                Edit Profile
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/settings"
                  )
                }
              >
                Settings
              </button>

              <button>

                Dark Mode

              </button>

              <hr />

              <button
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          )}

        </div>

      </div>
        
    </header>

  );

}

export default Navbar;