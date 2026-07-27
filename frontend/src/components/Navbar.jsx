import { useEffect, useState, useRef } from "react";
import { getCurrentUser, logoutUser } from "../services/auth";

import {
  useNavigate,
  Link
} from "react-router-dom";

import {
  searchUsers,
  getUnreadNotificationsCount,
  getNotifications,
  markNotificationRead
} from "../services/postService";


function Navbar() {

  const [user, setUser] =
    useState(null);

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
    notifications,
    setNotifications
  ] = useState([]);

  const [
    unreadNotifications,
    setUnreadNotifications
  ] = useState(0);

  const [
    showNotifications,
    setShowNotifications
  ] = useState(false);

  const [
    recentNotifications,
    setRecentNotifications
  ] = useState([]);

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

    async function loadUser() {

      try {

        const data =
          await getCurrentUser();

        setUser(data);

      } catch (error) {

        console.error(error);

      }

    }

    loadUser();

  }, []);

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

    async function loadUnreadCount() {

      try {

        const data =
          await getUnreadNotificationsCount();

        setUnreadNotifications(
          data.count || 0
        );

      } catch (error) {

        console.error(error);

      }

    }

    loadUnreadCount();

    const interval =
      setInterval(
        loadUnreadCount,
        5000
      );

    return () =>
      clearInterval(
        interval
      );

  }, []);

   function handleLogout() {

    logoutUser();
    navigate("/login");

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

        setNotifications(
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
              🔍
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
                    {user.name}
                  </Link>

                ))

              ) : (

                <div className="empty-state">

                  No users found

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

              🔔

            </span>

            {unreadNotifications > 0 && (

              <span className="notification-badge">

                {unreadNotifications}

              </span>

            )}

          </div>

          {
            showNotifications && (

              <div className="notifications-dropdown">

                {
                  recentNotifications.length === 0 ? (

                    <div className="dropdown-empty">

                      No notifications

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

        <div className="navbar-user">

          <div className="navbar-avatar">

            {
              user?.name?.charAt(0)
            }

          </div>

          <span>

            {
              user
                ? user.name
                : "Loading..."
            }

          </span>

        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Logout
        </button>

      </div>
        
    </header>

  );

}

export default Navbar;