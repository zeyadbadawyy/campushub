import {
  useState
} from "react";

import { useNavigate }
  from "react-router-dom";
  
import CommentSection
  from "./CommentSection";

import {
  toggleLike
} from "../services/postService";


function PostCard({ post, onLike }) {
  
  const [
    showComments,
    setShowComments
  ] = useState(false);

  const navigate =
    useNavigate();

  async function handleLike() {

    try {

      await toggleLike(
        post.id
      );

      onLike();

    } catch (error) {

      console.error(error);

    }

  }

  return (

    <div className="post-card">

      <div className="post-header">

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

      <div className="post-content">

        {post.content}

      </div>

      <div className="post-stats">

        <span
          className="social-btn"
          onClick={handleLike}
        >
          👍 {post.likes}
        </span>

        <span
          className="social-btn"
          onClick={() =>
            setShowComments(
              !showComments
            )
          }
        >
          💬 {post.comments}
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