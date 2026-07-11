import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/PostCard";

import { getPosts }
  from "../services/postService";
import CreatePost
  from "../components/CreatePost";

function Feed() {

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function loadPosts() {

    try {

      const data =
        await getPosts();

      setPosts(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadPosts();

  }, []);

  return (

    <MainLayout>

      <div className="feed-page">

        <div className="dashboard-header">

          <h1>
            Feed
          </h1>

          <p>
            See what's happening on campus.
          </p>

        </div>

        {loading && (
          <p>
            Loading posts...
          </p>
        )}

        <CreatePost
          onPostCreated={loadPosts}
        />

        {!loading &&
          posts.map((post) => (

            <PostCard
              key={post.id}
              post={post}
              onLike={loadPosts}
            />

          ))}

      </div>

    </MainLayout>

  );

}

export default Feed;