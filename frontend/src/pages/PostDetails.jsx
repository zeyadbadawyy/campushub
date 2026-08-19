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
  getPost
} from "../services/postService";

import {
  useWebSocket
}
from "../contexts/WebSocketContext";

function PostDetails() {

  const { id } =
    useParams();

  const [post, setPost] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const {
   postLikes,
   commentCounts
  } = useWebSocket();

  useEffect(() => {

    async function loadPost() {

      try {

        const data =
          await getPost(id);

        setPost(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    }

    loadPost();

  }, [id]);

  useEffect(() => {

    if (!postLikes.length) {
      return;
    }

    const latest =
      postLikes[0];

    if (
      Number(id) !== latest.post_id
    ) {
      return;
    }

    setPost(prev => {

      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        likes:
          prev.likes +
          latest.delta
      };

    });

  }, [postLikes, id]);

  useEffect(() => {

    if (!commentCounts.length) {
      return;
    }

    const latest =
      commentCounts[0];


    if (
      Number(id) !== latest.post_id
    ) {
      return;
    }


    setPost(prev => {

      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        comments:
          prev.comments +
          latest.delta
      };

    });


  }, [commentCounts,id]);

  return (

    <MainLayout>

      <div className="feed-page">

        <div className="dashboard-header">

          <h1>
            Post
          </h1>

          <p>
            View post details.
          </p>

        </div>

        {loading && (

          <p>
            Loading post...
          </p>

        )}

        {!loading && !post && (

          <div className="empty-state">

            Post not found

          </div>

        )}

        <button
          className="back-btn"
          onClick={() =>
            window.history.back()
          }
        >

          ←

        </button>

        {!loading && post && (

          <PostCard
            post={post}
          />

        )}

      </div>

    </MainLayout>

  );

}

export default PostDetails;