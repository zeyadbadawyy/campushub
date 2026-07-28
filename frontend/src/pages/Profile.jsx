import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useParams
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import PostCard
  from "../components/PostCard";

import {
  getUserProfile,
  getUserPosts,
  getFollowStats,
  getFollowStatus,
  toggleFollow
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";

function Profile() {

  const { id } =
    useParams();

  const [user, setUser] =
    useState(null);

  const [posts, setPosts] =
    useState([]);

  const [stats, setStats] =
    useState(null);

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const [
    isFollowing,
    setIsFollowing
  ] = useState(false);

  const navigate =
    useNavigate();

  const avatarColors = [
    "#4f46e5",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#ec4899"
  ];

  const avatarColor =
    avatarColors[
      (user?.id || 0) %
      avatarColors.length
    ];

  const [
    activeTab,
    setActiveTab
  ] = useState(
    "posts"
  );

  async function loadProfile() {

    try {

      const profile =
        await getUserProfile(
          id
        );

      const userPosts =
        await getUserPosts(
          id
        );

      const followStats =
        await getFollowStats(
          id
        );

      const me =
        await getCurrentUser();

      const followStatus =
        await getFollowStatus(
          id
        );

      setUser(
        profile
      );

      setPosts(
        userPosts
      );

      setStats(
        followStats
      );

      setCurrentUser(
        me
      );

      setIsFollowing(
        followStatus.isFollowing
      );

    } catch (error) {

      console.error(
        error
      );

    }

  }

  async function handleFollow() {

    try {

      await toggleFollow(
        id
      );

      loadProfile();

    } catch (error) {

      console.error(
        error
      );

    }

  }

  useEffect(() => {

    loadProfile();

    const interval =
      setInterval(
        loadProfile,
        30000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [id]);

  function getLastSeenText(lastSeen) {

    if (!lastSeen)
      return "Offline";

    const now =
      new Date();

    const time =
      new Date(lastSeen);

    const diff =
      Math.floor(
        (now - time) / 1000
      );

    if (diff < 120)
      return "● Online";;

    if (diff < 3600)
      return `Last seen ${Math.floor(diff / 60)}m ago`;

    if (diff < 86400)
      return `Last seen ${Math.floor(diff / 3600)}h ago`;

    return `Last seen ${Math.floor(diff / 86400)}d ago`;

  }

  // completion progress bar
  const completionItems = [
    !!user?.bio,
    !!user?.faculty,
    false
  ];

  const completedCount =
    completionItems.filter(Boolean).length;

  const completionPercentage =
    Math.round(
      (completedCount /
        completionItems.length) * 100
    );

  const profileComplete =
    completionPercentage === 100;

  if (!user) {

    return (

      <MainLayout>

        <p>
          Loading...
        </p>

      </MainLayout>

    );

  }

  return (

    <MainLayout>

      <div className="profile-page">

        <div className="profile-card">

          <div className="profile-banner"></div>

          <div className="profile-header">

             {currentUser?.id === user.id && (
              <button
                className="edit-profile-btn"
              >
                Edit Profile
              </button>
            )}

            <div className="profile-avatar-container">

              <div
                className="avatar large-avatar"
                style={{
                  background:
                    avatarColor
                }}
              >
                {user.name?.charAt(0)}
              </div>

              {
                getLastSeenText(
                  user.last_seen
                ) === "● Online" && (

                  <span className="online-dot"></span>

                )
              }

            </div>

            <h1 className="profile-name">
              {user.name}
            </h1>

            <div className="last-seen">

              {
                getLastSeenText(
                  user.last_seen
                )
              }

            </div>

            <div className="profile-role">

              {user.faculty}

            </div>
            
            <p>
              {user.bio}
            </p>

            {
              currentUser?.id === user.id && (

                <div
                  className="profile-progress-card"
                  onClick={() =>
                    navigate("/edit-profile")
                  }
                >

                  <div className="progress-header">

                    <h4>
                      Profile Completion
                    </h4>

                    <div>

                      <span>
                        {completionPercentage}%
                      </span>
                      
                      {
                        profileComplete && (
                          <span className="profile-complete-badge">
                            ✓ Complete
                          </span>
                        )
                      }

                    </div>

                  </div>

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${completionPercentage}%`
                      }}
                    ></div>

                  </div>

                  <p>
                    Add a profile picture
                    to complete your profile.
                  </p>

                </div>

              )
            }
            
            {currentUser?.id !== user.id && (

              <div
                className="profile-actions"
              >
                
                <button
                  className="follow-btn"
                  onClick={handleFollow}
                >

                  {isFollowing
                    ? "Unfollow"
                    : "Follow"}

                </button>

                <button
                  className="message-btn"
                  onClick={() =>
                    navigate(
                      `/messages/${user.id}`
                    )
                  }
                >

                  Message

                </button>

              </div>

            )}

            {stats && (

              <div className="profile-stats">

                <div>

                  <strong>
                    {stats.followers}
                  </strong>

                  <p>
                    Followers
                  </p>

                </div>

                <div>

                  <strong>
                    {stats.following}
                  </strong>

                  <p>
                    Following
                  </p>

                </div>

                <div>

                  <strong>
                    {posts.length}
                  </strong>

                  <p>
                    Posts
                  </p>

                </div>

              </div>

            )}

          </div>

        </div> 
        
        <div className="profile-tabs">

          <button
            className={`tab-btn ${
              activeTab === "posts"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("posts")
            }
          >
            Posts
          </button>

          <button
            className={`tab-btn ${
              activeTab === "about"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("about")
            }
          >
            About
          </button>

        </div>

        <div
          key={activeTab}
          className="tab-content"
        >    
          {
            activeTab === "posts"
            ? (

              <>
                <h2 className="profile-section-title">

                  Recent Posts

                </h2>

                {posts.length === 0
                  ? (
                    <p className="empty-state">
                      No posts yet.
                    </p>
                  )
                  : (
                    posts.map(
                      (post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={loadProfile}
                        />
                      )
                    )
                  )}
              </>

            )
            : (

              <div className="about-card">

                <div className="about-item">

                  <h4>
                    📝 Bio
                  </h4>

                  <p>
                    {
                      user.bio ||
                      "No bio yet."
                    }
                  </p>

                </div>

                <div className="about-item">

                  <h4>
                    🎓 Faculty
                  </h4>

                  <p>
                    {user.faculty}
                  </p>

                </div>

                <div className="about-item">

                  <h4>
                    📅 Joined
                  </h4>

                  <p>
                    {
                      new Date(
                        user.created_at
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          month: "long",
                          year: "numeric"
                        }
                      )
                    }
                  </p>

                </div>

              </div>

            )
          }
        </div>
      </div>

    </MainLayout>

  );

}

export default Profile;