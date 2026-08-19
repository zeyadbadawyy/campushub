import {
  useEffect,
  useState
} from "react";

import {
  getComments,
  createComment,
  getUserProfile,
  deleteComment
} from "../services/postService";

import {
  getCurrentUser
} from "../services/auth";

import {
  useWebSocket
} from "../contexts/WebSocketContext";

function CommentSection({
  postId,
  onCommentAdded
}) {

  const [comments, setComments] =
    useState([]);

  const [content, setContent] =
    useState("");

  const [
    currentUser,
    setCurrentUser
  ] = useState(null);

  const [
    openMenu,
    setOpenMenu
  ] = useState(null);

  const {
    comments: wsComments
  } = useWebSocket();

  useEffect(() => {

    async function loadUser() {

      try {

        const user =
          await getCurrentUser();

        setCurrentUser(user);

      } catch (error) {

        console.error(error);

      }

    }

    loadUser();

  }, []);

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
                author: user.name
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

  }, [postId]);

  useEffect(() => {

    if (!wsComments?.length) {
      return;
    }

    const newest =
      wsComments[0];

    if (
      newest.post_id !== postId
    ) {
      return;
    }


    setComments(prev => {

      const exists =
        prev.some(
          comment =>
            comment.id === newest.id
        );


      if (exists) {
        return prev;
      }


      return [
        newest,
        ...prev
      ];

    });


  }, [wsComments, postId]);

  async function handleComment() {

    if (!content.trim())
      return;

    try {

      await createComment(
        postId,
        content
      );

      setContent("");

    } catch (error) {

      console.error(error);

    }

  }

  async function handleDeleteComment(
    commentId
  ) {

    const confirmed =
      window.confirm(
        "Delete this comment?"
      );

    if (!confirmed)
      return;

    try {

      await deleteComment(
        commentId
      );

      setOpenMenu(null);

      loadComments();

      if (
        onCommentAdded
      ) {

        onCommentAdded();

      }

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
        
        {comments.length === 0 ? (

          <p className="empty-state">

            No comments yet.

          </p>

        ) : (

          comments.map(
          (comment) => (

            <div
              key={comment.id}
              className="comment-item"
            >

              <div className="comment-header">

                <strong>
                  {comment.author}
                </strong>

                {
                  currentUser?.id === comment.user_id && (

                    <div className="comment-menu-wrapper">

                      <button
                        className="comment-menu-btn"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === comment.id
                              ? null
                              : comment.id
                          )
                        }
                      >
                        ⋮
                      </button>

                      {
                        openMenu === comment.id && (

                          <div className="comment-dropdown">

                            <button
                              onClick={() =>
                                handleDeleteComment(
                                  comment.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        )
                      }

                    </div>

                  )
                }

              </div>

              <p>
                {comment.content}
              </p>

            </div>

          )
        )
        )}

      </div>

    </div>

  );

}

export default CommentSection;