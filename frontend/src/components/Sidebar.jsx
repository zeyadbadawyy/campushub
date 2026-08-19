import {
  NavLink
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  getCurrentUser,
} from "../services/postService";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

function Sidebar() {

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const {
    unreadCount
  } = useWebSocket();

  const {
    messages: wsMessages
  } = useWebSocket();

  useEffect(() => {

    async function loadUser() {

      try {

        const user =
          await getCurrentUser();

        setCurrentUser(
          user
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