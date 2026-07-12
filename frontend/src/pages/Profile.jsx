import {
  useEffect,
  useState
} from "react";

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
  getFollowStats
} from "../services/postService";

function Profile() {

  const { id } =
    useParams();

  const [user, setUser] =
    useState(null);

  const [posts, setPosts] =
    useState([]);

  const [stats, setStats] =
    useState(null);

  useEffect(() => {

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

        setUser(
          profile
        );

        setPosts(
          userPosts
        );

        setStats(
          followStats
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    loadProfile();

  }, [id]);

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

          <div className="avatar large-avatar">

            {user.name?.charAt(0)}

          </div>

          <h1>
            {user.name}
          </h1>

          <p>
            {user.bio}
          </p>

          <p>
            {user.faculty}
          </p>

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

            <p className="empty-posts">

              No posts yet.

            </p>

          ) : (

            posts.map(
              (post) => (

                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => {}}
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