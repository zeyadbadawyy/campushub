import api from "./api";

export async function loginUser(
  email,
  password
) {

  const response =
    await api.post(
      "/login",
      {
        email,
        password
      }
    );

  return response.data;

}

export async function registerUser(
  userData
) {

  const response =
    await api.post(
      "/register",
      userData
    );

  return response.data;

}

export async function getCurrentUser() {

  const token =
    localStorage.getItem("token");

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

export function logoutUser() {

  localStorage.removeItem(
    "token"
  );

}