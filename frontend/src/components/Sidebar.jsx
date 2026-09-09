import {
  LayoutDashboard,
  Newspaper,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/postService";
import { useWebSocket } from "../contexts/WebSocketContext";

import logo from "../assets/logo/t_logo.png";
import label from "../assets/logo/t_label.png";

function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);

  const { unreadCount } = useWebSocket();

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  const navigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Feed",
      path: "/feed",
      icon: Newspaper,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: MessageCircle,
      badge: unreadCount,
    },
    {
      label: "Profile",
      path: currentUser
        ? `/profile/${currentUser.id}`
        : "#",
      icon: UserRound,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="
            fixed inset-0 z-40
            bg-slate-950/40
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          border-r border-slate-200/80
          bg-white/95 backdrop-blur-xl
          transition-transform duration-300
          dark:border-slate-800
          dark:bg-slate-950/95
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col px-4 py-5">

          {/* Branding */}

            <div className="mb-8 flex items-center justify-between px-3">
              <button
                type="button"
                onClick={() => {
                  navigate("/feed");
                  onClose();
                }}
                className="
                  group
                  flex
                  items-center
                  rounded-2xl
                  text-left
                "
              >
                <img
                  src={logo}
                  alt="CampusHub"
                  className="
                    h-10
                    w-10
                    object-contain
                    ml-2
                  "
                />

                <img
                  src={label}
                  alt="CampusHub"
                  className="
                    h-10
                    w-50
                    object-contain
                    -ml-6
                    invert dark:invert-0
                    drop-shadow-[0_0_1px_rgba(0,0,0,0.3)]
                  "
                />

              </button>

              <button
                type="button"
                onClick={onClose}
                className="
                  flex h-9 w-9 items-center
                  justify-center rounded-xl
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                  dark:hover:bg-slate-900
                  dark:hover:text-white
                  lg:hidden
                "
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

          {/* Navigation */}

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                    group flex items-center gap-3
                    rounded-2xl px-3 py-3
                    text-sm font-medium
                    transition-all duration-200

                    ${
                      isActive
                        ? `
                          bg-indigo-50
                          text-indigo-700
                          shadow-sm
                          dark:bg-indigo-500/10
                          dark:text-indigo-400
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-100
                          hover:text-slate-950
                          dark:text-slate-400
                          dark:hover:bg-slate-900
                          dark:hover:text-white
                        `
                    }
                    `
                  }
                >
                  <Icon
                    size={19}
                    strokeWidth={2}
                    className="shrink-0"
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {item.badge > 0 && (
                    <span
                      className="
                        flex h-5 min-w-5
                        items-center justify-center
                        rounded-full
                        bg-indigo-600
                        px-1.5
                        text-[10px]
                        font-bold text-white
                      "
                    >
                      {item.badge > 99
                        ? "99+"
                        : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom card */}

          <div className="mt-auto">
            <div
              className="
                rounded-2xl
                border border-slate-200
                bg-slate-50 p-3
                dark:border-slate-800
                dark:bg-slate-900/70
              "
            >
              <p className="
                text-xs font-medium
                text-slate-500
                dark:text-slate-400
              ">
                CampusHub
              </p>

              <p className="mt-1 text-sm font-semibold">
                Connect. Share. Belong.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;