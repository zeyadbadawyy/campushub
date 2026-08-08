import {
  FaBell,
  FaHeart,
  FaComment,
  FaUser,
  FaUserPlus,
  FaUserCheck,
  FaEnvelope
} from "react-icons/fa";

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
  markNotificationRead,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest
} from "../services/postService";

function Notifications() {

  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    followRequests,
    setFollowRequests
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

        const requests =
          await getFollowRequests();

        setFollowRequests(
          requests || []
        );

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

  function getNotificationIcon(type) {

    switch (type) {

      case "follow":
        return <FaUser />;

      case "follow_request":
        return <FaUserPlus />;

      case "follow_request_accepted":
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

  async function handleAcceptRequest(
    requesterId
  ) {

    try {

      await acceptFollowRequest(
        requesterId
      );

      setFollowRequests(
        prev =>
          prev.filter(
            request =>
              request.requester_id !== requesterId
          )
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function handleRejectRequest(
    requesterId
  ) {

    try {

      await rejectFollowRequest(
        requesterId
      );

      setFollowRequests(
        prev =>
          prev.filter(
            request =>
              request.requester_id !== requesterId
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
        {
          followRequests.length > 0 && (

            <div className="follow-requests-section">

              <h2>
                Follow Requests
              </h2>

              <div className="follow-requests-list">

                {
                  followRequests.map(
                    (request) => (

                      <div
                        key={request.requester_id}
                        className="follow-request-card"
                        onClick={() =>
                          navigate(
                            `/profile/${request.requester_id}`
                          )
                        }
                      >

                        <div className="follow-request-info">

                          <div className="notification-avatar">

                            {
                              request.name?.charAt(0)
                            }

                          </div>

                          <div>

                            <strong>
                              {request.name}
                            </strong>

                            <p>
                              Wants to follow you
                            </p>

                          </div>

                        </div>

                        <div
                          className="follow-request-actions"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          <button
                            className="accept-btn"
                            onClick={() =>
                              handleAcceptRequest(
                                request.requester_id
                              )
                            }
                          >
                            Accept
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() =>
                              handleRejectRequest(
                                request.requester_id
                              )
                            }
                          >
                            Reject
                          </button>

                        </div>

                      </div>

                    )
                  )
                }

              </div>

            </div>

          )
        }

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

            <div className="notifications-skeleton">

              {[1, 2, 3, 4, 5].map((item) => (

                <div
                  key={item}
                  className="notification-skeleton-card"
                >

                  <div className="skeleton-avatar"></div>

                  <div className="skeleton-content">

                    <div className="skeleton-line short"></div>

                    <div className="skeleton-line"></div>

                    <div className="skeleton-line tiny"></div>

                  </div>

                </div>

              ))}

            </div>

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
                          getNotificationIcon(
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