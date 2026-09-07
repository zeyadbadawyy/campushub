import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Lock,
  MessageCircle,
  Pencil,
  Newspaper,
  UserRound,
  Users,
  UserPlus,
  UserCheck,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/PostCard";
import Avatar from "../components/Avatar";

import { useWebSocket } from "../contexts/WebSocketContext";

import {
  getUserProfile,
  getUserPosts,
  getFollowStats,
  getFollowStatus,
  toggleFollow,
  getMessageStatus,
  getFollowRequestStatus,
  cancelFollowRequest,
  getUserVisibility,
} from "../services/postService";

import { getCurrentUser } from "../services/auth";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  const [activeTab, setActiveTab] = useState("posts");

  const [canReceiveMessages, setCanReceiveMessages] =
    useState(true);

  const [canViewContent, setCanViewContent] =
    useState(true);

  const [, forceUpdate] = useState(0);

  const {
    onlineUsers,
    lastSeenUsers,
    postLikes,
    newPosts,
    commentCounts,
    followStatuses,
  } = useWebSocket();

  const isOnline = onlineUsers.includes(Number(id));

  const effectiveLastSeen =
    lastSeenUsers[user?.id] ||
    user?.last_seen;

  const completionItems = [
    !!user?.bio,
    !!user?.faculty,
    !!user?.avatar_url,
  ];

  const completedCount =
    completionItems.filter(Boolean).length;

  const completionPercentage =
    Math.round(
      (completedCount /
        completionItems.length) *
        100
    );

  const profileComplete =
    completionPercentage === 100;

  async function loadProfile() {
    try {
      const profile =
        await getUserProfile(id);

      const userPosts =
        await getUserPosts(id);

      const followStats =
        await getFollowStats(id);

      const me =
        await getCurrentUser();

      const followStatus =
        await getFollowStatus(id);

      const requestStatus =
        await getFollowRequestStatus(id);

      const messageStatus =
        await getMessageStatus(id);

      const visibility =
        await getUserVisibility(id);

      setCanViewContent(
        visibility.canViewContent
      );

      setCanReceiveMessages(
        messageStatus.allow_messages
      );

      setUser(profile);
      setPosts(userPosts);
      setStats(followStats);
      setCurrentUser(me);

      setIsFollowing(
        followStatus.isFollowing
      );

      setIsRequested(
        requestStatus.requested
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFollow() {
    try {
      if (isRequested) {
        await cancelFollowRequest(id);
      } else {
        await toggleFollow(id);
      }

      await loadProfile();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (!newPosts.length) {
      return;
    }

    const newest = newPosts[0];

    if (newest.user_id !== Number(id)) {
      return;
    }

    setPosts((prev) => {
      const exists = prev.some(
        (post) =>
          post.id === newest.id
      );

      if (exists) {
        return prev;
      }

      return [
        newest,
        ...prev,
      ];
    });
  }, [newPosts, id]);

  useEffect(() => {
    if (!postLikes.length) {
      return;
    }

    const latest = postLikes[0];

    setPosts((prev) =>
      prev.map((post) =>
        post.id === latest.post_id
          ? {
              ...post,
              likes:
                post.likes +
                latest.delta,
            }
          : post
      )
    );
  }, [postLikes]);

  useEffect(() => {
    if (!commentCounts.length) {
      return;
    }

    const latest =
      commentCounts[0];

    setPosts((prev) =>
      prev.map((post) =>
        post.id === latest.post_id
          ? {
              ...post,
              comments:
                post.comments +
                latest.delta,
            }
          : post
      )
    );
  }, [commentCounts]);

  useEffect(() => {
    if (!followStatuses.length) {
      return;
    }

    const latest =
      followStatuses[0];

    if (
      latest.sender_id !==
      currentUser?.id
    ) {
      return;
    }

    if (
      latest.receiver_id !==
      Number(id)
    ) {
      return;
    }

    if (
      latest.status ===
      "requested"
    ) {
      setIsRequested(true);
      setIsFollowing(false);
    }

    if (
      latest.status ===
      "following"
    ) {
      setIsFollowing(true);
      setIsRequested(false);
    }

    if (
      latest.status ===
      "none"
    ) {
      setIsFollowing(false);
      setIsRequested(false);
    }
  }, [
    followStatuses,
    currentUser,
    id,
  ]);

  function getLastSeenText(
    lastSeen,
    showOnlineStatus
  ) {
    if (!showOnlineStatus) {
      return "Offline";
    }

    if (!lastSeen) {
      return "Offline";
    }

    const now = new Date();
    const time = new Date(lastSeen);

    const diff = Math.floor(
      (now - time) / 1000
    );

    if (diff < 3600) {
      return `Last seen ${Math.floor(
        diff / 60
      )}m ago`;
    }

    if (diff < 86400) {
      return `Last seen ${Math.floor(
        diff / 3600
      )}h ago`;
    }

    return `Last seen ${Math.floor(
      diff / 86400
    )}d ago`;
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="
          mx-auto w-full max-w-4xl
          space-y-5
        ">
          <div className="
            h-[360px]
            animate-pulse
            rounded-3xl
            bg-white
            dark:bg-slate-900
          " />

          <div className="
            h-14
            animate-pulse
            rounded-2xl
            bg-white
            dark:bg-slate-900
          " />

          <div className="
            h-60
            animate-pulse
            rounded-3xl
            bg-white
            dark:bg-slate-900
          " />
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile =
    currentUser?.id === user.id;

  return (
    <MainLayout>
      <div className="
        mx-auto w-full max-w-4xl
        space-y-6
      ">

        {/* PROFILE HERO */}

        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="
            overflow-hidden
            rounded-3xl
            border border-slate-200/80
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          {/* Cover */}

          <div className="
            relative h-36
            bg-gradient-to-br
            from-indigo-600
            via-violet-600
            to-slate-900
            sm:h-44
          ">
            <div className="
              absolute inset-0
              bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)]
            " />
          </div>

          {/* Profile content */}

          <div className="
            relative px-5 pb-6
            sm:px-7
          ">

            {/* Avatar */}

            <div className="
              -mt-12
              flex items-end
              justify-between
            ">
              <div className="
                relative
                rounded-[22px]
                border-4
                border-white
                bg-white
                dark:border-slate-900
                dark:bg-slate-900
              ">
                <Avatar
                  user={user}
                  size="xl"
                />

                {isOnline && (
                  <span className="
                    absolute
                    bottom-1
                    right-1
                    h-4
                    w-4
                    rounded-full
                    border-[3px]
                    border-white
                    bg-emerald-500
                    dark:border-slate-900
                  " />
                )}
              </div>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/edit-profile"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-200
                    dark:hover:bg-slate-800
                  "
                >
                  <Pencil size={15} />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Identity */}

            <div className="
              mt-4
              flex flex-col
              gap-4
            ">
              <div>
                <h1 className="
                  text-2xl
                  font-bold
                  tracking-tight
                ">
                  {user.name}
                </h1>

                <div className="
                  mt-1
                  flex flex-wrap
                  items-center
                  gap-2
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                ">
                  <span className="
                    inline-flex
                    items-center
                    gap-1.5
                  ">
                    <GraduationCap
                      size={15}
                    />
                    {user.faculty ||
                      "CampusHub User"}
                  </span>

                  {!isOwnProfile && (
                    <>
                      <span>•</span>

                      <span
                        className={
                          isOnline
                            ? "text-emerald-500"
                            : ""
                        }
                      >
                        {isOnline
                          ? "Online"
                          : getLastSeenText(
                              effectiveLastSeen,
                              user.show_online_status
                            )}
                      </span>
                    </>
                  )}
                </div>

                {user.bio && (
                  <p className="
                    mt-4
                    max-w-2xl
                    whitespace-pre-wrap
                    text-sm
                    leading-6
                    text-slate-600
                    dark:text-slate-300
                  ">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Actions */}

              {!isOwnProfile && (
                <div className="
                  flex flex-wrap
                  gap-2
                ">
                  <button
                    type="button"
                    onClick={handleFollow}
                    className={`
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      px-5 py-2.5
                      text-sm
                      font-semibold
                      transition
                      ${
                        isFollowing
                          ? `
                            border
                            border-slate-200
                            bg-slate-100
                            text-slate-700
                            hover:bg-slate-200
                            dark:border-slate-700
                            dark:bg-slate-800
                            dark:text-slate-200
                            dark:hover:bg-slate-700
                          `
                          : `
                            bg-indigo-600
                            text-white
                            hover:bg-indigo-700
                          `
                      }
                    `}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck
                          size={16}
                        />
                        Following
                      </>
                    ) : isRequested ? (
                      <>
                        <UserCheck
                          size={16}
                        />
                        Requested
                      </>
                    ) : (
                      <>
                        <UserPlus
                          size={16}
                        />
                        Follow
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !canReceiveMessages
                    }
                    onClick={() =>
                      navigate(
                        `/messages/${user.id}`
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-5 py-2.5
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-slate-200
                      dark:hover:bg-slate-800
                    "
                    title={
                      !canReceiveMessages
                        ? "This user is not accepting new messages."
                        : ""
                    }
                  >
                    <MessageCircle
                      size={16}
                    />
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}

            {stats && (
              <div className="
                mt-6
                grid
                grid-cols-3
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                dark:border-slate-800
                dark:bg-slate-950/50
              ">
                <div className="
                  px-3 py-4
                  text-center
                ">
                  <strong className="
                    block text-lg
                    font-bold
                  ">
                    {stats.followers}
                  </strong>

                  <span className="
                    mt-1 block
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">
                    Followers
                  </span>
                </div>

                <div className="
                  border-x
                  border-slate-200
                  px-3 py-4
                  text-center
                  dark:border-slate-800
                ">
                  <strong className="
                    block text-lg
                    font-bold
                  ">
                    {stats.following}
                  </strong>

                  <span className="
                    mt-1 block
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">
                    Following
                  </span>
                </div>

                <div className="
                  px-3 py-4
                  text-center
                ">
                  <strong className="
                    block text-lg
                    font-bold
                  ">
                    {posts.length}
                  </strong>

                  <span className="
                    mt-1 block
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">
                    Posts
                  </span>
                </div>
              </div>
            )}

            {/* Completion */}

            {isOwnProfile && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/edit-profile"
                  )
                }
                className="
                  mt-4 w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  text-left
                  transition
                  hover:border-indigo-200
                  hover:bg-indigo-50/40
                  dark:border-slate-800
                  dark:bg-slate-950/50
                  dark:hover:border-indigo-500/30
                  dark:hover:bg-indigo-500/5
                "
              >
                <div className="
                  flex items-center
                  justify-between
                  gap-4
                ">
                  <div>
                    <div className="
                      flex items-center gap-2
                    ">
                      <h3 className="
                        text-sm
                        font-semibold
                      ">
                        Profile completion
                      </h3>

                      {profileComplete && (
                        <CheckCircle2
                          size={16}
                          className="
                            text-emerald-500
                          "
                        />
                      )}
                    </div>

                    <p className="
                      mt-1 text-xs
                      text-slate-500
                      dark:text-slate-400
                    ">
                      {profileComplete
                        ? "Your profile is complete."
                        : "Complete your profile to help students know you better."}
                    </p>
                  </div>

                  <span className="
                    text-sm
                    font-bold
                    text-indigo-600
                    dark:text-indigo-400
                  ">
                    {completionPercentage}%
                  </span>
                </div>

                <div className="
                  mt-3 h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-200
                  dark:bg-slate-800
                ">
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-indigo-600
                      transition-all
                    "
                    style={{
                      width:
                        `${completionPercentage}%`,
                    }}
                  />
                </div>
              </button>
            )}
          </div>
        </motion.section>

        {/* TABS */}

        <div className="
          flex items-center
          rounded-2xl
          border border-slate-200
          bg-white
          p-1
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        ">
          <button
            type="button"
            onClick={() =>
              setActiveTab("posts")
            }
            className={`
              flex flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              px-4 py-3
              text-sm
              font-semibold
              transition
              ${
                activeTab === "posts"
                  ? `
                    bg-slate-100
                    text-slate-950
                    dark:bg-slate-800
                    dark:text-white
                  `
                  : `
                    text-slate-500
                    hover:text-slate-900
                    dark:text-slate-400
                    dark:hover:text-white
                  `
              }
            `}
          >
            <Newspaper size={17} />
            Posts
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("about")
            }
            className={`
              flex flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              px-4 py-3
              text-sm
              font-semibold
              transition
              ${
                activeTab === "about"
                  ? `
                    bg-slate-100
                    text-slate-950
                    dark:bg-slate-800
                    dark:text-white
                  `
                  : `
                    text-slate-500
                    hover:text-slate-900
                    dark:text-slate-400
                    dark:hover:text-white
                  `
              }
            `}
          >
            <UserRound size={17} />
            About
          </button>
        </div>

        {/* TAB CONTENT */}

        {activeTab === "posts" ? (
          <motion.div
            key="posts"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="space-y-4"
          >
            <div className="
              flex items-center
              justify-between
            ">
              <div>
                <h2 className="
                  text-lg
                  font-bold
                  tracking-tight
                ">
                  Recent Posts
                </h2>

                <p className="
                  mt-1 text-xs
                  text-slate-500
                  dark:text-slate-400
                ">
                  {posts.length}{" "}
                  {posts.length === 1
                    ? "post"
                    : "posts"}
                </p>
              </div>

              <Newspaper
                size={20}
                className="
                  text-slate-300
                  dark:text-slate-700
                "
              />
            </div>

            {!canViewContent ? (
              <PrivateAccount />
            ) : posts.length === 0 ? (
              <EmptyPosts />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={loadProfile}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="about"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.25,
            }}
          >
            {!canViewContent ? (
              <PrivateAccount />
            ) : (
              <div className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-200/80
                bg-white
                shadow-sm
                dark:border-slate-800
                dark:bg-slate-900
              ">
                <div className="
                  border-b
                  border-slate-100
                  px-5 py-4
                  dark:border-slate-800
                ">
                  <h2 className="
                    font-semibold
                  ">
                    About {user.name}
                  </h2>
                </div>

                <div className="
                  divide-y
                  divide-slate-100
                  dark:divide-slate-800
                ">
                  <AboutItem
                    icon={
                      <Pencil size={17} />
                    }
                    label="Bio"
                    value={
                      user.bio ||
                      "No bio yet."
                    }
                  />

                  <AboutItem
                    icon={
                      <GraduationCap
                        size={17}
                      />
                    }
                    label="Faculty"
                    value={
                      user.faculty ||
                      "No faculty yet."
                    }
                  />

                  <AboutItem
                    icon={
                      <CalendarDays
                        size={17}
                      />
                    }
                    label="Joined"
                    value={new Date(
                      user.created_at
                    ).toLocaleDateString(
                      "en-GB",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  />

                  <AboutItem
                    icon={
                      <Users size={17} />
                    }
                    label="Community"
                    value="CampusHub member"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}

function AboutItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="
      flex gap-4
      px-5 py-5
    ">
      <div className="
        flex h-9 w-9
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-indigo-50
        text-indigo-600
        dark:bg-indigo-500/10
        dark:text-indigo-400
      ">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="
          text-xs
          font-medium
          text-slate-400
        ">
          {label}
        </p>

        <p className="
          mt-1
          whitespace-pre-wrap
          text-sm
          leading-6
          text-slate-700
          dark:text-slate-200
        ">
          {value}
        </p>
      </div>
    </div>
  );
}

function PrivateAccount() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        px-6 py-16
        text-center
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div className="
        mx-auto
        flex h-14 w-14
        items-center
        justify-center
        rounded-2xl
        bg-slate-100
        text-slate-500
        dark:bg-slate-800
        dark:text-slate-400
      ">
        <Lock size={23} />
      </div>

      <h3 className="
        mt-4
        text-lg
        font-semibold
      ">
        Private Account
      </h3>

      <p className="
        mx-auto mt-2
        max-w-sm
        text-sm
        text-slate-500
        dark:text-slate-400
      ">
        Follow this user to view
        their profile content.
      </p>
    </motion.div>
  );
}

function EmptyPosts() {
  return (
    <div className="
      rounded-3xl
      border
      border-dashed
      border-slate-300
      bg-white
      px-6 py-16
      text-center
      dark:border-slate-700
      dark:bg-slate-900
    ">
      <div className="
        mx-auto
        flex h-14 w-14
        items-center
        justify-center
        rounded-2xl
        bg-indigo-50
        text-indigo-600
        dark:bg-indigo-500/10
        dark:text-indigo-400
      ">
        <Newspaper size={23} />
      </div>

      <h3 className="
        mt-4
        text-lg
        font-semibold
      ">
        No posts yet
      </h3>

      <p className="
        mt-2
        text-sm
        text-slate-500
        dark:text-slate-400
      ">
        This profile hasn't
        shared anything yet.
      </p>
    </div>
  );
}

export default Profile;