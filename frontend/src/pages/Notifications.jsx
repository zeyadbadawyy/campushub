import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Heart,
  MessageCircle,
  UserRound,
  UserPlus,
  UserCheck,
  Mail,
  Check,
  X,
  Clock,
  Inbox,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Avatar from "../components/Avatar";

import {
  getNotifications,
  markNotificationsRead,
  markNotificationRead,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from "../services/postService";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const {
    notifications: wsNotifications,
    setNotificationCount,
    requests,
    setRequests,
  } = useWebSocket();

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data =
          await getNotifications();

        const followRequests =
          await getFollowRequests();

        setRequests(
          followRequests || []
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

  useEffect(() => {

    if (!wsNotifications.length) {
      return;
    }

    const newest =
      wsNotifications[0];

    setNotifications((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === newest.id
      );

      if (exists) {
        return prev.map(
          (item) =>
            item.id === newest.id
              ? newest
              : item
        );
      }

      return [
        newest,
        ...prev,
      ];
    });

  }, [wsNotifications]);

  async function handleMarkRead() {
    try {
      await markNotificationsRead();

      setNotificationCount(0);

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        }))
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

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(
        diff / 60
      )}m ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(
        diff / 3600
      )}h ago`;
    }

    if (diff < 172800) {
      return "Yesterday";
    }

    return `${Math.floor(
      diff / 86400
    )}d ago`;
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "follow":
        return <UserRound size={16} />;

      case "follow_request":
        return <UserPlus size={16} />;

      case "follow_accepted":
        return <UserCheck size={16} />;

      case "like":
        return <Heart size={16} />;

      case "comment":
        return (
          <MessageCircle size={16} />
        );

      case "message":
        return <Mail size={16} />;

      default:
        return <Bell size={16} />;
    }
  }

  function getNotificationRoute(
    notification
  ) {
    switch (notification.type) {
      case "like":
      case "comment":
        return `/posts/${notification.target_id}`;

      case "message":
        return `/messages/${notification.sender_id}`;

      case "follow":
      case "follow_accepted":
        return `/profile/${notification.sender_id}`;

      case "follow_request":
        return "/notifications";

      default:
        return "/";
    }
  }

  async function handleNotificationClick(
    notification
  ) {
    try {
      if (!notification.is_read) {
        await markNotificationRead(
          notification.id
        );

        setNotificationCount(
          (prev) =>
            Math.max(0, prev - 1)
        );

        setNotifications((prev) =>
          prev.map((item) =>
            item.id ===
            notification.id
              ? {
                  ...item,
                  is_read: true,
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

      setRequests((prev) =>
        prev.filter(
          (request) =>
            request.requester_id !==
            requesterId
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

      setRequests((prev) =>
        prev.filter(
          (request) =>
            request.requester_id !==
            requesterId
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  return (
    <MainLayout>
      <div className="
        mx-auto
        w-full
        max-w-4xl
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
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-500/10
              dark:text-indigo-400
            ">
              <Bell size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Notifications
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Stay up to date with
                your campus activity.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkRead}
              className="
                inline-flex
                w-fit
                items-center gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4 py-2.5
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                dark:border-slate-800
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              <Check size={16} />
              Mark all as read
            </button>
          )}
        </motion.div>

        {/* Follow Requests */}

        <AnimatePresence>
          {requests.length > 0 && (
            <motion.section
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="
                mb-6
                overflow-hidden
                rounded-3xl
                border
                border-indigo-100
                bg-indigo-50/50
                dark:border-indigo-500/20
                dark:bg-indigo-500/5
              "
            >
              <div className="
                flex items-center gap-3
                border-b
                border-indigo-100
                px-5 py-4
                dark:border-indigo-500/20
              ">
                <div className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-indigo-600
                  shadow-sm
                  dark:bg-slate-900
                  dark:text-indigo-400
                ">
                  <UserPlus size={17} />
                </div>

                <div>
                  <h2 className="
                    text-sm font-semibold
                  ">
                    Follow Requests
                  </h2>

                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">
                    People who want
                    to connect with you
                  </p>
                </div>

                <span className="
                  ml-auto
                  rounded-full
                  bg-indigo-600
                  px-2 py-1
                  text-[10px]
                  font-bold
                  text-white
                ">
                  {requests.length}
                </span>
              </div>

              <div className="
                divide-y
                divide-indigo-100
                dark:divide-indigo-500/10
              ">
                {requests.map(
                  (request) => (
                    <motion.div
                      layout
                      key={
                        request.requester_id
                      }
                      className="
                        flex
                        flex-col
                        gap-4
                        px-5 py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/profile/${request.requester_id}`
                          )
                        }
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                          text-left
                        "
                      >
                        <Avatar
                          user={{
                            id: request.requester_id,
                            name: request.name,
                            avatar_url:
                              request.avatar_url,
                          }}
                          size="md"
                        />

                        <div className="min-w-0">
                          <p className="
                            truncate
                            text-sm
                            font-semibold
                          ">
                            {request.name}
                          </p>

                          <p className="
                            mt-1
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                          ">
                            Wants to follow you
                          </p>
                        </div>
                      </button>

                      <div className="
                        flex
                        shrink-0
                        gap-2
                      ">
                        <button
                          type="button"
                          onClick={() =>
                            handleAcceptRequest(
                              request.requester_id
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-indigo-600
                            px-4 py-2.5
                            text-xs
                            font-semibold
                            text-white
                            transition
                            hover:bg-indigo-700
                          "
                        >
                          <Check size={15} />
                          Accept
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRejectRequest(
                              request.requester_id
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4 py-2.5
                            text-xs
                            font-semibold
                            text-slate-600
                            transition
                            hover:bg-slate-50
                            dark:border-slate-700
                            dark:bg-slate-900
                            dark:text-slate-300
                            dark:hover:bg-slate-800
                          "
                        >
                          <X size={15} />
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Notification summary */}

        {!loading && (
          <div className="
            mb-3
            flex items-center
            justify-between
          ">
            <div className="
              flex items-center gap-2
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
                Recent activity
              </span>
            </div>

            <span className="
              text-xs
              text-slate-400
            ">
              {notifications.length} total
            </span>
          </div>
        )}

        {/* Loading */}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="
                    h-24
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
          notifications.length === 0 && (
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
                px-6 py-16
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
                bg-slate-100
                text-slate-400
                dark:bg-slate-800
              ">
                <Bell size={24} />
              </div>

              <h2 className="
                mt-4
                text-lg
                font-semibold
              ">
                You're all caught up
              </h2>

              <p className="
                mx-auto mt-2
                max-w-sm
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                New likes, comments,
                follows and messages
                will appear here.
              </p>
            </motion.div>
          )}

        {/* Notifications */}

        {!loading &&
          notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map(
                (
                  notification,
                  index
                ) => (
                  <motion.button
                    type="button"
                    key={notification.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                      delay:
                        Math.min(
                          index * 0.03,
                          0.18
                        ),
                    }}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`
                      group
                      relative
                      flex
                      w-full
                      items-start
                      gap-3
                      rounded-2xl
                      border
                      p-4
                      text-left
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:shadow-md

                      ${
                        notification.is_read
                          ? `
                            border-slate-200/80
                            bg-white
                            dark:border-slate-800
                            dark:bg-slate-900
                          `
                          : `
                            border-indigo-100
                            bg-indigo-50/60
                            shadow-sm
                            dark:border-indigo-500/20
                            dark:bg-indigo-500/5
                          `
                      }
                    `}
                  >
                    {/* Avatar */}

                    <div className="
                      relative
                      shrink-0
                    ">
                      <Avatar
                        user={{
                          id: notification.sender_id,
                          name:
                            notification.sender_name,
                          avatar_url:
                            notification.sender_avatar_url,
                        }}
                        size="md"
                      />

                      <span className="
                        absolute
                        -bottom-1
                        -right-1
                        flex
                        h-6 w-6
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-white
                        bg-indigo-600
                        text-white
                        dark:border-slate-900
                      ">
                        {getNotificationIcon(
                          notification.type
                        )}

                        {notification.type === "message" &&
                          notification.message_count > 1 && (
                            <span className="
                              absolute
                              -right-2
                              -top-2
                              flex
                              h-4
                              min-w-4
                              items-center
                              justify-center
                              rounded-full
                              bg-red-500
                              px-1
                              text-[8px]
                              font-bold
                              text-white
                            ">
                              {notification.message_count > 99
                                ? "99+"
                                : notification.message_count}
                            </span>
                          )}
                      </span>
                    </div>

                    {/* Content */}

                    <div className="
                      min-w-0
                      flex-1
                    ">
                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      ">
                        <p className="
                          text-sm
                          leading-5
                          text-slate-700
                          dark:text-slate-200
                        ">
                          <strong className="
                            font-semibold
                            text-slate-950
                            dark:text-white
                          ">
                            {
                              notification.sender_name
                            }
                          </strong>{" "}
                          {
                            notification.message
                          }
                        </p>

                        {!notification.is_read && (
                          <span className="
                            mt-1
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                            bg-indigo-600
                          " />
                        )}
                      </div>

                      <div className="
                        mt-2
                        flex items-center
                        gap-2
                        text-xs
                        text-slate-400
                      ">
                        <Clock size={13} />

                        <span>
                          {formatTime(
                            notification.created_at
                          )}
                        </span>

                        <span>•</span>

                        <span className="
                          capitalize
                        ">
                          {
                            notification.type
                          }
                        </span>
                      </div>
                    </div>
                  </motion.button>
                )
              )}
            </div>
          )}
      </div>
    </MainLayout>
  );
}

export default Notifications;