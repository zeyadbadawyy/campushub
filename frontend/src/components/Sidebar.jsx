import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

function Sidebar() {

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
        </NavLink>

        <NavLink
          to="/profile/3"
        >
          Profile
        </NavLink>

      </nav>

    </aside>

  );

}

export default Sidebar;