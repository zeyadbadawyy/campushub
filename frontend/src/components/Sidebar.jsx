import {
  NavLink
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  getCurrentUser,
  getUnreadMessagesCount
} from "../services/postService";

function Sidebar() {

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const [
    unreadCount,
    setUnreadCount
  ] = useState(0);

  useEffect(() => {

    async function loadUser() {

      try {

        const user =
          await getCurrentUser();

        setCurrentUser(
          user
        );

        const unreadData =
          await getUnreadMessagesCount();

        setUnreadCount(
          unreadData.count
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    loadUser();

  }, []);

  return (

    <aside className="sidebar">

      <h2 className="sidebar-logo">
        🎓 CampusHub
      </h2>

      <nav>

        <NavLink
          to="/dashboard"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/feed"
        >
          Feed
        </NavLink>

        <NavLink
          to="/messages"
        >
          Messages

          {
            unreadCount > 0 && (

              <span
                className="sidebar-badge"
              >
                {unreadCount}
              </span>

            )
          }

        </NavLink>

        <NavLink
          to={
            currentUser
              ? `/profile/${currentUser.id}`
              : "#"
          }
        >
          Profile
        </NavLink>


      </nav>

    </aside>

  );

}

export default Sidebar;