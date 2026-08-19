import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  getCurrentUser,
} from "../services/auth";

const AuthContext =
  createContext();

export function AuthProvider({
  children,
}) {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadUser() {

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {

        setLoading(false);

        return;

      }

      try {

        const currentUser =
          await getCurrentUser();

        setUser(
          currentUser
        );

      } catch (error) {

        console.error(error);

        localStorage.removeItem(
          "token"
        );

      }

      setLoading(false);

    }

    loadUser();

  }, []);

  async function login(
    email,
    password
  ) {

    const data =
      await loginUser(
        email,
        password
      );

    localStorage.setItem(
      "token",
      data.token
    );

    const currentUser =
      await getCurrentUser();

    setUser(
      currentUser
    );

    return currentUser;

  }

  function logout() {

    localStorage.removeItem(
      "token"
    );

    setUser(null);

  }

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export function useAuth() {

  return useContext(
    AuthContext
  );

}