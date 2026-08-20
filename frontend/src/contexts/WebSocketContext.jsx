import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAuth
} from "./AuthContext";

import {
  getUnreadNotificationsCount
} from "../services/postService";

const WebSocketContext =
  createContext();

export function WebSocketProvider({
  children,
}) {

  const [socket, setSocket] =
    useState(null);

  const wsRef =
    useRef(null);

  const {
    user
  } = useAuth();

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [typingUsers, setTypingUsers] =
    useState([]);

  const [readReceipts, setReadReceipts] =
    useState({});
  
  const [unreadCount, setUnreadCount] =
    useState(0);

  const [lastSeenUsers, setLastSeenUsers] =
    useState({});

  const [notifications, setNotifications] =
    useState([]);

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [requests, setRequests] = 
    useState([]);
  
  const [
    followStatuses,
    setFollowStatuses
  ] = useState([]);

  const [comments, setComments] =
    useState([]);

  const [commentCounts, setCommentCounts] =
    useState([]);

  const [postLikes, setPostLikes] =
    useState([]);

  const [newPosts, setNewPosts] =
    useState([]);

  useEffect(() => {

    async function loadCount() {

      try {

        const data =
          await getUnreadNotificationsCount();

        setNotificationCount(
          data.count || 0
        );

      } catch (error) {

        console.error(error);

      }

    }

    if (user) {
      loadCount();
    }

  }, [user]);

  useEffect(() => {

    console.log(
      "WS MESSAGES:",
      messages
    );

  }, [messages]);

  useEffect(() => {

    if (!user) {
      return;
    }

    console.log(
      "CONNECTING WS FOR USER:",
      user.id
    );

    const wsProtocol =
      window.location.protocol === "https:"
        ? "wss"
        : "ws";

    const ws = new WebSocket(
      `${wsProtocol}://${import.meta.env.VITE_WS_URL}/ws?userId=${user.id}`
    );

    wsRef.current = ws;

    setSocket(ws);

    ws.onopen = () => {

      console.log(
        "WebSocket Connected"
      );

    };

    ws.onmessage = (event) => {

      const data =
        JSON.parse(
          event.data
        );

      console.log(
        "WS MESSAGE:",
        data
      );

      if (
        data.type === "online_users"
      ) {

        setOnlineUsers(
          data.users || []
        );

      }

      if (
        data.type === "online"
      ) {

        if (data.userId === user.id) {
          return;
        }

        setOnlineUsers(
          (prev) => {

            if (
              prev.includes(
                data.userId
              )
            ) {
              return prev;
            }

            return [
              ...prev,
              data.userId,
            ];

          }
        );

      }

      if (data.type === "offline") {

        if (data.userId === user.id) {
          return;
        }

        setOnlineUsers(
          prev =>
            prev.filter(
              id => id !== data.userId
            )
        );

        if (data.lastSeen) {

          setLastSeenUsers(
            prev => ({
              ...prev,
              [data.userId]: data.lastSeen,
            })
          );

        }

      }

      if (
        data.sender_id &&
        data.receiver_id
      ) {

        setMessages(
          (prev) => [
            ...prev,
            data
          ]
        );

      }

      if (
        data.type === "typing"
      ) {

        setTypingUsers(
          (prev) => {

            if (
              prev.includes(
                data.userId
              )
            ) {
              return prev;
            }

            return [
              ...prev,
              data.userId
            ];

          }
        );

        setTimeout(() => {

          setTypingUsers(
            (prev) =>
              prev.filter(
                (id) =>
                  id !== data.userId
              )
          );

        }, 2500);

      }

      if (data.type === "read") {

        setReadReceipts(
          (prev) => ({
            ...prev,
            [data.readerId]:
              data.readUntilMessageId,
          })
        );

      }

      if (data.type === "unread_count") {

        setUnreadCount(
          data.count
        );

      }

      if (data.type === "notification") {

        setNotifications(
          prev => [
            data.notification,
            ...prev
          ]
        );

        setNotificationCount(
          prev => prev + 1
        );

      }

      if (data.type === "follow_request") {

        setRequests((prev) => [
          data.request,
          ...prev,
        ]);
      }

      if (data.type === "follow_request_cancelled") {

        setRequests(prev =>
          prev.filter(
            request =>
              request.requester_id !==
              data.requester_id
          )
        );

      }


      if (data.type === "comment") {

        setComments(
          prev => [
            data.comment,
            ...prev
          ]
        );

      }

      if (data.type === "comment_count") {

        setCommentCounts(prev => [
          data,
          ...prev,
        ]);

      }

      if (data.type === "post_like") {

        setPostLikes(prev => [
          data,
          ...prev,
        ]);

      }

      if (data.type === "new_post") {

        setNewPosts(prev => [
          data.post,
          ...prev,
        ]);

      }

      if (
        data.type === "follow_status"
      ) {

        setFollowStatuses(
          prev => [
            data,
            ...prev
          ]
        );

      }


    };
    
    return () => {

      ws.close();

    };

  }, [user]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        onlineUsers,
        messages,
        typingUsers,
        readReceipts,
        unreadCount,
        lastSeenUsers,
        notifications,
        notificationCount,
        setNotificationCount,
        requests,
        setRequests,
        comments,
        setComments,
        commentCounts,
        postLikes,
        newPosts,
        followStatuses,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );

}

export function useWebSocket() {

  return useContext(
    WebSocketContext
  );

}