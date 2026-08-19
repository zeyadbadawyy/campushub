import {
  FaHeart,
  FaComment,
  FaEdit,
  FaTrash
} from "react-icons/fa";

import {
  useState,
  useEffect
} from "react";

import { useNavigate }
  from "react-router-dom";
  
import CommentSection
  from "./CommentSection";

import {
  toggleLike,
  updatePost,
  deletePost
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

function PostCard({ post, onLike }) {
  
  const [
    showComments,
    setShowComments
  ] = useState(false);

  const [
    isEditing,
    setIsEditing
  ] = useState(false);

  const [
    editedContent,
    setEditedContent
  ] = useState(post.content);

  const navigate =
    useNavigate();
  
  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const [
    liked,
    setLiked
  ] = useState(
    post.liked_by_me || false
  );

  const {
    postLikes
    } = useWebSocket();

  useEffect(() => {

    async function loadUser() {

      try {

        const data =
          await getCurrentUser();

        setCurrentUser(data);

      } catch (error) {

        console.error(error);

      }

    }

    loadUser();

  }, []);

  
  async function handleLike() {

    try {

      await toggleLike(
        post.id
      );

      setLiked(
        prev => !prev
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function handleUpdate() {

    try {

      await updatePost(
        post.id,
        editedContent
      );

      setIsEditing(false);

      onLike();

    } catch (error) {

      console.error(error);

    }

  }

  async function handleDelete() {

    const confirmed =
      window.confirm(
        "Delete this post?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await deletePost(
        post.id
      );

      onLike();

    } catch (error) {

      console.error(error);

    }

  }

  useEffect(() => {

    if (!postLikes.length) {
      return;
    }

    const latest =
      postLikes[0];

    if (
    latest.post_id !== post.id
    ) {
      return;
    }


    if (
    latest.user_id === currentUser?.id
    ) {

    setLiked(
      latest.liked
    );

    }

  }, [
  postLikes,
  post.id,
  currentUser
  ]);

  return (

    <div className="post-card">

      <div className="post-header">

        <div className="post-user">

          <div
            className="avatar clickable"
            onClick={() =>
              navigate(
                `/profile/${post.user_id}`
              )
            }
          >
            {post.author?.charAt(0)}
          </div>

          <div>

            <h3
              className="clickable-name"
              onClick={() =>
                navigate(
                  `/profile/${post.user_id}`
                )
              }
            >
              {post.author}
            </h3>

            <p>
              {post.faculty}
            </p>

          </div>

        </div>

        {
          currentUser?.id === post.user_id && (

            <div className="post-actions">

              <button
                className="edit-btn"
                onClick={() =>
                  setIsEditing(true)
                }
              >
                <>
                  <FaEdit />
                  Edit
                </>
              </button>

              <button
                className="delete-btn"
                onClick={handleDelete}
              >
                <>
                  <FaTrash />
                  Delete
                </>
              </button>

            </div>

          )
        }

      </div>

      <div className="post-content">

        {
          isEditing ? (

            <div>

              <textarea
                value={editedContent}
                onChange={(e) =>
                  setEditedContent(
                    e.target.value
                  )
                }
              />

              <button
                className="save-btn"
                onClick={handleUpdate}
              >
                Save
              </button>

              <button
                className="cancel-btn"
                onClick={() =>
                  setIsEditing(false)
                }
              >
                Cancel
              </button>

            </div>

          ) : (

            post.content

          )
        }

      </div>
      
      

      <div className="post-stats">

        <span
          className={`social-btn ${
            liked ? "liked" : ""
          }`}
          onClick={handleLike}
        >
          <>
            <FaHeart />
            {post.likes}
          </>
        </span>

        <span
          className="social-btn"
          onClick={() =>
            setShowComments(
              !showComments
            )
          }
        >

          <>
            <FaComment />
            {post.comments}
          </>

        </span>

      </div>
      {
        showComments && (

          <CommentSection
            postId={post.id}
            onCommentAdded={onLike}
          />

        )
      }      
    </div>

  );

}

export default PostCard;