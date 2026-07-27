import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
}
  from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  getNotifications,
  markNotificationsRead,
  markNotificationRead
} from "../services/postService";

function Notifications() {

  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  useEffect(() => {

    async function loadNotifications() {

      try {

        const data =
          await getNotifications();

        setNotifications(
          data || []
        );

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    }

    loadNotifications();

  }, []);

  async function handleMarkRead() {

    try {

      await markNotificationsRead();

      setNotifications(
        (prev) =>
          prev.map(
            (notification) => ({
              ...notification,
              is_read: true
            })
          )
      );

    } catch (error) {

      console.error(error);

    }

  }

  function formatTime(dateString) {

    const date =
      new Date(dateString);

    const diff =
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) / 1000
      );

    if (diff < 60)
      return "Just now";

    if (diff < 3600)
      return `${Math.floor(diff / 60)}m ago`;

    if (diff < 86400)
      return `${Math.floor(diff / 3600)}h ago`;

    if (diff < 172800)
      return "Yesterday";

    return `${Math.floor(diff / 86400)}d ago`;

  }

  function getIcon(type) {

    switch (type) {

      case "follow":
        return "👤";

      case "like":
        return "❤️";

      case "comment":
        return "💬";

      case "message":
        return "✉️";

      default:
        return "🔔";

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

  const unreadCount =
    notifications.filter(
      (n) => !n.is_read
    ).length;

  return (

    <MainLayout>

      <div className="notifications-page">

        <div className="notifications-header">

          <div>

            <h1>
              Notifications
            </h1>

            <p>
              {unreadCount}
              {" "}
              unread notifications
            </p>

          </div>

          {
            unreadCount > 0 && (

              <button
                className="mark-read-btn"
                onClick={
                  handleMarkRead
                }
              >
                Mark all as read
              </button>

            )
          }

        </div>

        {
          loading ? (

            <p>
              Loading...
            </p>

          ) : notifications.length === 0 ? (

            <div className="empty-state">

              <h3>
                No notifications yet
              </h3>

              <p>
                Activity will appear here.
              </p>

            </div>

          ) : (

            <div className="notifications-list">

              {
                notifications.map(
                  (notification) => (

                    <div
                      key={notification.id}
                      className={
                        notification.is_read
                          ? "notification-card"
                          : "notification-card unread"
                      }
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                    >
                      <div className="notification-avatar">

                        {
                          notification.sender_name?.charAt(0)
                        }

                      </div>

                      <div className="notification-icon">

                        {
                          getIcon(
                            notification.type
                          )
                        }

                      </div>

                      <div className="notification-content">

                        <div className="notification-top">

                          <span className="notification-type">

                            {
                              notification.type
                            }

                          </span>

                          {
                            !notification.is_read && (

                              <span className="notification-dot">

                                ●

                              </span>

                            )
                          }

                        </div>

                        <p className="notification-message">

                          <strong>
                            {notification.sender_name}
                          </strong>

                          {" "}

                          {notification.message}

                        </p>

                        <span className="notification-time">

                          {
                            formatTime(
                              notification.created_at
                            )
                          }

                        </span>

                      </div>

                    </div>

                  )
                )
              }

            </div>

          )
        }

      </div>

    </MainLayout>

  );

}

export default Notifications;