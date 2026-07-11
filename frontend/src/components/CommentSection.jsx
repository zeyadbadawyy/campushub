import {
  useEffect,
  useState
} from "react";

import {
  getComments,
  createComment,
  getUserProfile
} from "../services/postService";

function CommentSection({
  postId
}) {

  const [comments, setComments] =
    useState([]);

  const [content, setContent] =
    useState("");

  async function loadComments() {

    try {

      const commentsData =
        await getComments(
          postId
        );

      const commentsWithUsers =
        await Promise.all(

          commentsData.map(
            async (comment) => {

              const user =
                await getUserProfile(
                  comment.user_id
                );

              return {
                ...comment,
                author:
                  user.name
              };

            }
          )

        );

      setComments(
        commentsWithUsers
      );

    } catch (error) {

      console.error(error);

    }

  }

  useEffect(() => {

    loadComments();

  }, []);

  async function handleComment() {

    if (!content.trim())
      return;

    try {

      await createComment(
        postId,
        content
      );

      setContent("");

      loadComments();

    } catch (error) {

      console.error(error);

    }

  }

  return (

    <div className="comment-section">

      <div className="comment-form">

        <input
          value={content}
          onChange={(e) =>
            setContent(
              e.target.value
            )
          }
          placeholder="Write a comment..."
        />

        <button
          onClick={handleComment}
        >
          Comment
        </button>

      </div>

      <div className="comments-list">

        {comments.map(
          (comment) => (

            <div
              key={comment.id}
              className="comment-item"
            >

              <strong>
                {comment.author}
              </strong>

              <p>
                {comment.content}
              </p>

            </div>

          )
        )}

      </div>

    </div>

  );

}

export default CommentSection;