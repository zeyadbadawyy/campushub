import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";
import {
  logoutUser
} from "../services/auth";

import {
  useNavigate
} from "react-router-dom";


function Navbar() {

  const [user, setUser] =
    useState(null);

  const navigate =
    useNavigate();

  function handleLogout() {

    logoutUser();
    navigate("/login");

  }

  useEffect(() => {

    async function loadUser() {

      try {

        const data =
          await getCurrentUser();

        setUser(data);

      } catch (error) {

        console.error(error);

      }

    }

    loadUser();

  }, []);

  return (

    <header className="navbar">

      <div>

        <h3>
          Welcome Back 👋
        </h3>

      </div>

      <div className="navbar-right">

        <div className="navbar-user">

          {
            user
              ? user.name
              : "Loading..."
          }

        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Logout
        </button>

      </div>
        
    </header>

  );

}

export default Navbar;