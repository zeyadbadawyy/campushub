import {
  Bell,
  Search,
  UserRound,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  Mail,
  Settings,
  Pencil,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Menu,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

import {
  useTheme,
} from "../contexts/ThemeContext";

import {
  searchUsers,
  getNotifications,
  markNotificationRead,
} from "../services/postService";

import Avatar from "./Avatar";

function Navbar({ onMenuClick }) {
  const {
    darkMode,
    toggleDarkMode,
  } = useTheme();

  const {
    notifications,
    notificationCount,
    setNotificationCount,
  } = useWebSocket();

  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    async function performSearch() {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      try {
        const cleanedSearch = search.replace(/\s+/g, "");

        const data = await searchUsers(cleanedSearch);

        setResults(data || []);
      } catch (error) {
        console.error(error);
      }
    }

    const timer = setTimeout(performSearch, 250);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setResults([]);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
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

  useEffect(() => {
    if (!notifications.length) {
      return;
    }

    const newest = notifications[0];

    setRecentNotifications((prev) =>
      [newest, ...prev].slice(0, 5)
    );
  }, [notifications]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleSearch() {
    if (!search.trim()) {
      return;
    }

    const query = search;

    setSearch("");
    setResults([]);

    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  async function loadNotificationsPreview() {
    try {
      const data = await getNotifications();

      setRecentNotifications(
        (data || []).slice(0, 5)
      );
    } catch (error) {
      console.error(error);
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    const diff = Math.floor(
      (now - date) / 1000
    );

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`;
    }

    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getNotificationIcon(type) {
    const iconClass = "h-4 w-4";

    switch (type) {
      case "follow":
        return <UserRound className={iconClass} />;

      case "follow_request":
        return <UserPlus className={iconClass} />;

      case "follow_accepted":
        return <UserCheck className={iconClass} />;

      case "like":
        return <Heart className={iconClass} />;

      case "comment":
        return <MessageCircle className={iconClass} />;

      case "message":
        return <Mail className={iconClass} />;

      default:
        return <Bell className={iconClass} />;
    }
  }

  function getNotificationRoute(notification) {
    switch (notification.type) {
      case "like":
      case "comment":
        return `/posts/${notification.target_id}`;

      case "message":
        return `/messages/${notification.sender_id}`;

      case "follow":
      case "follow_accepted":
        return `/profile/${notification.sender_id}`;

      case "follow_request":
        return "/notifications";

      default:
        return "/";
    }
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.is_read) {
        await markNotificationRead(
          notification.id
        );

        setNotificationCount((prev) =>
          Math.max(0, prev - 1)
        );

        setRecentNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item
          )
        );
      }

      navigate(
        getNotificationRoute(notification)
      );

      setShowNotifications(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <header
      className="
        sticky top-0 z-30
        border-b border-slate-200/80
        bg-white/85 backdrop-blur-xl
        dark:border-slate-800
        dark:bg-slate-950/85
      "
    >
      <div
        className="
          flex h-20 items-center justify-between
          gap-4 px-4 sm:px-6 lg:px-8
        "
      >

        {/* Mobile menu */}

        <button
          type="button"
          onClick={onMenuClick}
          className="
            flex h-10 w-10 items-center
            justify-center rounded-xl
            text-slate-500
            hover:bg-slate-100
            hover:text-slate-950
            dark:hover:bg-slate-900
            dark:hover:text-white
            lg:hidden
          "
        >
          <Menu size={20} />
        </button>

        {/* Welcome */}

        <div className="hidden min-w-0 md:block">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back
          </p>

          <h2 className="truncate text-lg font-semibold tracking-tight">
            {user?.name || "CampusHub User"}
          </h2>
        </div>

        {/* Search */}

        <div
          ref={searchRef}
          className="relative flex-1 md:max-w-md"
        >
          <div
            className="
              flex h-11 items-center gap-2 rounded-2xl
              border border-slate-200
              bg-slate-100/70 px-3
              transition
              focus-within:border-indigo-500
              focus-within:bg-white
              focus-within:ring-4
              focus-within:ring-indigo-500/10
              dark:border-slate-800
              dark:bg-slate-900
              dark:focus-within:bg-slate-900
            "
          >
            <Search
              size={18}
              className="shrink-0 text-slate-400"
            />

            <input
              type="text"
              value={search}
              placeholder="Search people..."
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="
                min-w-0 flex-1 bg-transparent
                text-sm outline-none
                placeholder:text-slate-400
              "
            />

            <kbd
              className="
                hidden rounded-md border border-slate-200
                bg-white px-1.5 py-0.5 text-[10px]
                font-medium text-slate-400
                sm:inline-flex
                dark:border-slate-700
                dark:bg-slate-800
              "
            >
              Enter
            </kbd>
          </div>

          {search && (
            <div
              className="
                absolute left-0 right-0 top-14
                overflow-hidden rounded-2xl
                border border-slate-200
                bg-white shadow-xl shadow-slate-900/10
                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              {results.length > 0 ? (
                results.map((resultUser) => (
                  <Link
                    key={resultUser.id}
                    to={`/profile/${resultUser.id}`}
                    onClick={() => {
                      setSearch("");
                      setResults([]);
                    }}
                    className="
                      flex items-center gap-3 px-4 py-3
                      transition
                      hover:bg-slate-50
                      dark:hover:bg-slate-800
                    "
                  >
                    <Avatar
                      user={resultUser}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {resultUser.name}
                      </p>

                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {resultUser.faculty ||
                          "CampusHub User"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <UserRound
                    size={20}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-2 text-sm font-medium">
                    No users found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right controls */}

        <div className="flex items-center gap-2">

          {/* Theme */}

          <button
            onClick={toggleDarkMode}
            className="
              hidden h-10 w-10 items-center justify-center
              rounded-xl text-slate-500
              transition hover:bg-slate-100 hover:text-slate-950
              sm:flex
              dark:hover:bg-slate-900 dark:hover:text-white
            "
            title={
              darkMode
                ? "Light mode"
                : "Dark mode"
            }
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          {/* Notifications */}

          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              onClick={async () => {
                if (!showNotifications) {
                  await loadNotificationsPreview();
                }

                setShowNotifications(
                  (prev) => !prev
                );

                setShowAccountMenu(false);
              }}
              className="
                relative flex h-10 w-10
                items-center justify-center
                rounded-xl text-slate-500
                transition
                hover:bg-slate-100
                hover:text-slate-950
                dark:hover:bg-slate-900
                dark:hover:text-white
              "
            >
              <Bell size={19} />

              {notificationCount > 0 && (
                <span
                  className="
                    absolute right-1 top-1
                    flex h-4 min-w-4 items-center
                    justify-center rounded-full
                    bg-indigo-600 px-1
                    text-[9px] font-bold text-white
                  "
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="
                  absolute right-0 top-13
                  w-[360px] max-w-[calc(100vw-2rem)]
                  overflow-hidden rounded-2xl
                  border border-slate-200
                  bg-white shadow-2xl shadow-slate-900/10
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              >
                <div
                  className="
                    flex items-center justify-between
                    border-b border-slate-100
                    px-4 py-3
                    dark:border-slate-800
                  "
                >
                  <div>
                    <h3 className="text-sm font-semibold">
                      Notifications
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your latest activity
                    </p>
                  </div>

                  {notificationCount > 0 && (
                    <span
                      className="
                        rounded-full bg-indigo-50 px-2 py-1
                        text-[10px] font-semibold
                        text-indigo-600
                        dark:bg-indigo-500/10
                        dark:text-indigo-400
                      "
                    >
                      {notificationCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <Bell
                        size={24}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-medium">
                        No notifications yet
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        You're all caught up.
                      </p>
                    </div>
                  ) : (
                    recentNotifications.map(
                      (notification) => (
                        <button
                          key={notification.id}
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={`
                            flex w-full gap-3
                            px-4 py-3 text-left
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-slate-800
                            ${
                              !notification.is_read
                                ? "bg-indigo-50/50 dark:bg-indigo-500/5"
                                : ""
                            }
                          `}
                        >
                          <div className="relative shrink-0">
                            <Avatar
                              user={{
                                id: notification.sender_id,
                                name: notification.sender_name,
                                avatar_url:
                                  notification.sender_avatar_url,
                              }}
                              size="md"
                            />

                            <span
                              className="
                                absolute -bottom-1
                                -right-1 flex h-5 w-5
                                items-center justify-center
                                rounded-full border-2
                                border-white
                                bg-indigo-600
                                text-white
                                dark:border-slate-900
                              "
                            >
                              {getNotificationIcon(
                                notification.type
                              )}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p className="truncate text-sm">
                                <span className="font-semibold">
                                  {
                                    notification.sender_name
                                  }
                                </span>{" "}
                                {
                                  notification.message
                                }
                              </p>

                              {!notification.is_read && (
                                <span
                                  className="
                                    mt-1 h-2 w-2
                                    shrink-0 rounded-full
                                    bg-indigo-600
                                  "
                                />
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatTime(
                                notification.created_at
                              )}
                            </p>
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/notifications");
                  }}
                  className="
                    w-full border-t border-slate-100
                    px-4 py-3 text-sm font-semibold
                    text-indigo-600 transition
                    hover:bg-slate-50
                    dark:border-slate-800
                    dark:text-indigo-400
                    dark:hover:bg-slate-800
                  "
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* Account */}

          <div
            ref={accountMenuRef}
            className="relative"
          >
            <button
              onClick={() => {
                setShowAccountMenu(
                  (prev) => !prev
                );

                setShowNotifications(false);
              }}
              className="
                flex items-center gap-2 rounded-2xl
                p-1.5 pr-2
                transition
                hover:bg-slate-100
                dark:hover:bg-slate-900
              "
            >
              <Avatar
                user={user}
                size="sm"
              />

              <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">
                {user?.name}
              </span>

              <ChevronDown
                size={16}
                className="hidden text-slate-400 lg:block"
              />
            </button>

            {showAccountMenu && (
              <div
                className="
                  absolute right-0 top-13
                  w-60 overflow-hidden
                  rounded-2xl border
                  border-slate-200 bg-white
                  p-1.5 shadow-2xl
                  shadow-slate-900/10
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              >
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-semibold">
                    {user?.name}
                  </p>

                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>

                <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                <button
                  onClick={() => {
                    navigate(`/profile/${user.id}`);
                    setShowAccountMenu(false);
                  }}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                  "
                >
                  <UserRound size={17} />
                  My Profile
                </button>

                <button
                  onClick={() => {
                    navigate("/edit-profile");
                    setShowAccountMenu(false);
                  }}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                  "
                >
                  <Pencil size={17} />
                  Edit Profile
                </button>

                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowAccountMenu(false);
                  }}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                  "
                >
                  <Settings size={17} />
                  Settings
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    transition
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                  "
                >
                  {darkMode ? (
                    <Sun size={17} />
                  ) : (
                    <Moon size={17} />
                  )}

                  {darkMode
                    ? "Light Mode"
                    : "Dark Mode"}
                </button>

                <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                <button
                  onClick={handleLogout}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm font-medium
                    text-red-600 transition
                    hover:bg-red-50
                    dark:text-red-400
                    dark:hover:bg-red-500/10
                  "
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;