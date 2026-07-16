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

  const response = await api.get(
    "/posts?page=1&limit=10"
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

  const response =
    await api.get(
      `/users/${userId}/posts`
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

export async function getFollowStatus(userId) {

  const token =
    localStorage.getItem("token");

  const response =
    await fetch(
      `http://localhost:8080/users/${userId}/follow-status`,
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
      `http://localhost:8080/users/${userId}/follow`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

  return response.json();

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