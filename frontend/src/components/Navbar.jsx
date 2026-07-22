import { useEffect, useState, useRef } from "react";
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

  const searchRef =
    useRef(null);

  useEffect(() => {

    async function performSearch() {

      if (!search.trim()) {

        setResults([]);

        return;

      }

      try {

        const cleanedSearch =
          search.replace(/\s+/g, "");

        const data =
          await searchUsers(
            cleanedSearch
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

  useEffect(() => {

    function handleClickOutside(
      event
    ) {

      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {

        setResults([]);
        setSearch("");

      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);

   function handleLogout() {

    logoutUser();
    navigate("/login");

  }

  function handleSearch() {

    if (!search.trim())
      return;

    const query = search;

    setSearch("");
    setResults([]);

    navigate(`/search?q=${query}`);

  }

  return (

    <header className="navbar">

      <div>

        <h3>
          Welcome Back 👋
        </h3>

      </div>

      <div className="navbar-right">

        <div
          className="search-container"
          ref={searchRef}
        >

          <div className="search-box">

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  handleSearch();

                }

              }}
              className="search-input"
            />

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              🔍
            </button>

          </div>

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

                <div className="empty-state">

                  No users found

                </div>

              )}

            </div>

          )}

        </div>

        <div className="navbar-user">

          <div className="navbar-avatar">

            {
              user?.name?.charAt(0)
            }

          </div>

          <span>

            {
              user
                ? user.name
                : "Loading..."
            }

          </span>

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