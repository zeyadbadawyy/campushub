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

          <div className="profile-avatar-container">

            <div className="avatar large-avatar">

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

          <h1>
            {user.name}
          </h1>

          <div className="last-seen">

            {
              getLastSeenText(
                user.last_seen
              )
            }

          </div>

          <p>
            {user.bio}
          </p>

          <p>
            {user.faculty}
          </p>

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

            </div>

          )}

        </div>

        <div>

          <h2>
            Posts
          </h2>

          {posts?.length === 0 ? (

            <p className="empty-state">

              No posts yet.

            </p>

          ) : (

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

        </div>

      </div>

    </MainLayout>

  );

}

export default Profile;