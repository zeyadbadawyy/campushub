import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser }
  from "../services/auth";

function Register() {

  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      bio: "",
      faculty: ""
    });

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setLoading(true);

      await registerUser(formData);

      alert(
        "Registration successful!"
      );

      navigate("/login");

    } catch (error) {

      console.error(error);

      alert(
        "Registration failed"
      );

    } finally {

      setLoading(false);

    }

  }

  function handleChange(e) {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });

  }

  return (

    <div className="auth-layout">

      <div className="auth-card">

        <h1>
          Create Account
        </h1>

        <p>
          Join CampusHub today.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <input
            type="text"
            name="faculty"
            placeholder="Faculty"
            value={formData.faculty}
            onChange={handleChange}
          />

          <input
            type="text"
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
          />

          <button
            type="submit"
          >
            {
              loading
                ? "Creating..."
                : "Register"
            }
          </button>

        </form>

        <p
          style={{
            marginTop: "20px"
          }}
        >
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>

  );

}

export default Register;