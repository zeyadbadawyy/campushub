import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/PostCard";

import { getPosts }
  from "../services/postService";
import CreatePost
  from "../components/CreatePost";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

function Feed() {

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const {
    postLikes,
    newPosts,
    commentCounts
  } = useWebSocket();

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

  useEffect(() => {

    if (!postLikes.length) {
      return;
    }

    const latest =
      postLikes[0];

    setPosts(prev =>
      prev.map(post =>
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

    if (!newPosts.length) {
      return;
    }

    const newest =
      newPosts[0];

    setPosts(prev => {

      const exists =
        prev.some(
          post =>
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

  }, [newPosts]);

  useEffect(() => {

  if (!commentCounts.length) {
    return;
  }

  const latest =
    commentCounts[0];


  setPosts(prev =>
    prev.map(post =>
      post.id === latest.post_id
        ? {
            ...post,
            comments:
              post.comments +
              latest.delta
          }
        : post
    )
  );

  }, [commentCounts]);

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