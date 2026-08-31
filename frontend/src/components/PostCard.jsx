import {
  FaHeart,
  FaComment,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCameraRetro
} from "react-icons/fa";

import {
  useState,
  useEffect
} from "react";

import {
  useNavigate
} from "react-router-dom";

import CommentSection
  from "./CommentSection";

import {
  toggleLike,
  updatePost,
  deletePost,
  uploadPostImage
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";

import Avatar from "./Avatar";

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

  const [
    editedImage,
    setEditedImage
  ] = useState(
    post.image_url || ""
  );

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

  const [
    showImage,
    setShowImage
  ] = useState(false);

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
        editedContent,
        editedImage
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
            onClick={() =>
              navigate(
                `/profile/${post.user_id}`
              )
            }
          >

            <Avatar
              user={{
                id: post.user_id,
                name: post.author,
                avatar_url: post.avatar_url
              }}
              size="md"
              className="clickable"
            />

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
                onClick={() => {

                  setEditedContent(
                    post.content
                  );

                  setEditedImage(
                    post.image_url || ""
                  );

                  setIsEditing(true);

                }}
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

            <div className="edit-post-box">

              <textarea
                value={editedContent}
                onChange={(e) =>
                  setEditedContent(
                    e.target.value
                  )
                }
              />

              {
                editedImage && (

                  <div className="preview-container">

                    <img
                      src={editedImage}
                      alt=""
                      className="post-preview"
                    />

                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() =>
                        setEditedImage("")
                      }
                    >
                      <FaTimes />
                    </button>

                  </div>

                )
              }

              <label className="image-edit-btn">

                <FaCameraRetro />
                {
                  editedImage
                    ? "Change Photo"
                    : "Add Photo"
                }

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {

                    const file =
                      e.target.files[0];

                    if (!file) {
                      return;
                    }

                    try {

                      const result =
                        await uploadPostImage(
                          file
                        );

                      setEditedImage(
                        result.url
                      );

                    } catch (error) {

                      console.error(error);

                    }

                  }}
                />

              </label>

              <div className="edit-actions">

                <button
                  className="save-btn"
                  onClick={handleUpdate}
                >
                  Save
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => {

                    setEditedContent(
                      post.content
                    );

                    setEditedImage(
                      post.image_url || ""
                    );

                    setIsEditing(false);

                  }}
                >
                  Cancel
                </button>

              </div>

            </div>

          ) : (

            <>
              {
                post.content && (
                  <p className="post-text">
                    {post.content}
                  </p>
                )
              }

              {
                post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="post-image"
                    onClick={() =>
                      setShowImage(true)
                    }
                  />
                )
              }
            </>

          )
        }

        {
          showImage && (

            <div
              className="image-modal"
              onClick={() =>
                setShowImage(false)
              }
            >

              <img
                src={post.image_url}
                alt="Post"
                className="image-modal-content"
              />

            </div>

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