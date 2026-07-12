import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";
import {
  logoutUser
} from "../services/auth";

import {
  useNavigate
} from "react-router-dom";

import {
  searchUsers
} from "../services/postService";

import {
  Link
} from "react-router-dom";


function Navbar() {

  const [user, setUser] =
    useState(null);

  const navigate =
    useNavigate();
  
  const [
    search,
    setSearch
  ] = useState("");

  const [
    results,
    setResults
  ] = useState([]);

  useEffect(() => {

    async function performSearch() {

      if (!search.trim()) {

        setResults([]);

        return;

      }

      try {

        const data =
          await searchUsers(
            search
          );

        setResults(
          data || []
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    performSearch();

  }, [search]);

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

        <div className="search-container">

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="search-input"
          />

          {search && (

            <div className="search-dropdown">

              {results?.length > 0 ? (

                results.map((user) => (

                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="search-result"
                  >
                    {user.name}
                  </Link>

                ))

              ) : (

                <div className="search-empty">

                  No users found

                </div>

              )}

            </div>

          )}

        </div>

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