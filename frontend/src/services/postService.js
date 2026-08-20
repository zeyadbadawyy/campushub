import api from "./api";

export async function getCurrentUser() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/me",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getPosts() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/posts?page=1&limit=10",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function createPost(content) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.post(
      "/posts",
      {
        content
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;
}

export async function toggleLike(
  postId
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.post(
      `/posts/${postId}/like`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getComments(
  postId
) {

  const response =
    await api.get(
      `/posts/${postId}/comments`
    );

  return response.data;

}

export async function createComment(
  postId,
  content
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.post(
      `/posts/${postId}/comments`,
      {
        content
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getUserProfile(
  userId
) {

  const response =
    await api.get(
      `/users/${userId}`
    );

  return response.data;

}

export async function getUserPosts(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      `/users/${userId}/posts`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getFollowStats(
  userId
) {

  const response =
    await api.get(
      `/users/${userId}/follow-stats`
    );

  return response.data;

}

export async function searchUsers(
  query
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      `/users/search?q=${query}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function searchUsersForChats(
  query
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      `/users/search-chats?q=${query}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getFollowStatus(userId) {

  const token =
    localStorage.getItem("token");

  const response =
    await fetch(
       `${import.meta.env.VITE_API_URL}/users/${userId}/follow-status`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

  return response.json();

}

export async function toggleFollow(userId) {

  const token =
    localStorage.getItem("token");

  const response =
    await fetch(
      `${import.meta.env.VITE_API_URL}/users/${userId}/follow`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

  return response.json();

}

export async function getPost(
  postId
) {

  const response =
    await api.get(
      `/posts/${postId}`
    );

  return response.data;

}

export async function updatePost(
  postId,
  content
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.put(
      `/posts/${postId}`,
      {
        content
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function deletePost(
  postId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.delete(
      `/posts/${postId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function deleteComment(
  commentId
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.delete(
      `/comments/${commentId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getConversations() {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      "/conversations",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getConversation(
  userId
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      `/messages/${userId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function sendMessage(
  userId,
  content
) {

  const token =
    localStorage.getItem("token");

  const response =
    await api.post(
      `/messages/${userId}`,
      {
        content
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getUnreadMessagesCount() {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      "/messages/unread-count",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function updateTypingStatus(
  userId,
  isTyping
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(
      `/typing/${userId}`,
      {
        is_typing: isTyping
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getTypingStatus(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      `/typing/${userId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getMessageStatus(
  id
) {

  const token =
  localStorage.getItem(
    "token"
  );

  const response =
    await api.get(
       `/users/${id}/message-status`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getOnlineStatus(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      `/users/${userId}/online`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getNotifications() {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      "/notifications",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getUnreadNotificationsCount() {

  const token =
    localStorage.getItem("token");

  const response =
    await api.get(
      "/notifications/unread-count",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function markNotificationsRead() {

  const token =
    localStorage.getItem("token");

  const response =
    await api.put(
      "/notifications/read",
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function markNotificationRead(
  notificationId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.put(
      `/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function updateProfile(
  profileData
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.put(
      "/me",
      profileData,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function changePassword(
  currentPassword,
  newPassword
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.put(
      "/change-password",
      {
        currentPassword,
        newPassword
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getUserActivity() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/activity",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getSettings() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/settings",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function updateSettings(
  settings
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.put(
      "/settings",
      settings,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function deleteAccount() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.delete(
      "/delete-account",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getFollowRequestStatus(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      `/users/${userId}/follow-request-status`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function cancelFollowRequest(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.delete(
      `/users/${userId}/follow-request`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getUserVisibility(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      `/users/${userId}/visibility`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function getFollowRequests() {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.get(
      "/follow-requests",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function acceptFollowRequest(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.post(
      `/follow-requests/${userId}/accept`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}

export async function rejectFollowRequest(
  userId
) {

  const token =
    localStorage.getItem(
      "token"
    );

  const response =
    await api.delete(
      `/follow-requests/${userId}/reject`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

  return response.data;

}