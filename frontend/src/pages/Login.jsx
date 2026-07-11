import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";

import { loginUser }
  from "../services/auth";

function Login() {

  
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const navigate =
    useNavigate();

  const handleLogin =
  async () => {

    try {

      const data =
        await loginUser(
          email,
          password
        );

      localStorage.setItem(
        "token",
        data.token
      );

      navigate(
        "/dashboard"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Invalid credentials"
      );

    }

  };
  

  return (

    <AuthLayout>

      <div className="auth-card">

        <h1>
          Welcome Back
        </h1>

        <p>
          Sign in to CampusHub
        </p>

        <input
           value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
        >
          Sign In
        </button>

      </div>

    </AuthLayout>

  );

}

export default Login;