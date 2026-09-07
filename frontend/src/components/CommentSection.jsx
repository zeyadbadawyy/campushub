import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  Smile,
  Send,
  MoreHorizontal,
  Trash2,
  MessageCircle,
} from "lucide-react";

import EmojiPicker from "emoji-picker-react";

import {
  getComments,
  createComment,
  getUserProfile,
  deleteComment,
} from "../services/postService";

import {
  getCurrentUser,
} from "../services/auth";

import Avatar from "./Avatar";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

function CommentSection({
  postId,
  onCommentAdded,
}) {
  const [comments, setComments] =
    useState([]);

  const [content, setContent] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState(null);

  const [openMenu, setOpenMenu] =
    useState(null);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const pickerRef = useRef(null);

  const inputRef = useRef(null);

  const {
    comments: wsComments,
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
        await getComments(postId);

      const commentsWithUsers =
        await Promise.all(
          commentsData.map(
            async (comment) => {
              try {
                const user =
                  await getUserProfile(
                    comment.user_id
                  );

                return {
                  ...comment,
                  author: user.name,
                  avatar_url:
                    user.avatar_url,
                };
              } catch (error) {
                console.error(error);

                return {
                  ...comment,
                  author: "CampusHub User",
                  avatar_url: null,
                };
              }
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

    setComments((prev) => {
      const exists =
        prev.some(
          (comment) =>
            comment.id ===
            newest.id
        );

      if (exists) {
        return prev;
      }

      return [
        {
          ...newest,
          avatar_url:
            newest.avatar_url ||
            null,
        },
        ...prev,
      ];
    });
  }, [
    wsComments,
    postId,
  ]);

  useEffect(() => {
    function handleClickOutside(
      event
    ) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target
        )
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleComment() {
    if (!content.trim() || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      await createComment(
        postId,
        content.trim()
      );

      setContent("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(
    commentId
  ) {
    const confirmed =
      window.confirm(
        "Delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteComment(
        commentId
      );

      setOpenMenu(null);

      await loadComments();

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleEmojiClick(
    emojiData
  ) {
    setContent(
      (prev) =>
        prev + emojiData.emoji
    );

    inputRef.current?.focus();
  }

  return (
    <div className="relative space-y-4 overflow-visible">

      {/* Composer */}

      <div className="
        flex
        items-end
        gap-2
      ">
        <div className="shrink-0">
          <Avatar
            user={currentUser}
            size="sm"
          />
        </div>

        <div className="
          relative
          flex-1
        ">
          <div className="
            flex
            items-end
            gap-2
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-2
            transition
            focus-within:border-indigo-500
            focus-within:bg-white
            focus-within:ring-4
            focus-within:ring-indigo-500/10
            dark:border-slate-700
            dark:bg-slate-950
            dark:focus-within:bg-slate-950
          ">
            <input
              ref={inputRef}
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              placeholder="Write a comment..."
              className="
                min-w-0
                flex-1
                bg-transparent
                px-2
                py-2
                text-sm
                outline-none
                placeholder:text-slate-400
              "
            />

            <button
              type="button"
              onClick={() =>
                setShowEmojiPicker(
                  (prev) => !prev
                )
              }
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-slate-400
                transition
                hover:bg-amber-50
                hover:text-amber-600
                dark:hover:bg-amber-500/10
                dark:hover:text-amber-400
              "
            >
              <Smile size={17} />
            </button>

            <button
              type="button"
              onClick={handleComment}
              disabled={
                submitting ||
                !content.trim()
              }
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-600
                text-white
                transition
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Send size={16} />
            </button>
          </div>

          {/* Emoji picker */}

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={pickerRef}
                initial={{
                  opacity: 0,
                  y: 8,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 8,
                  scale: 0.97,
                }}
                className="
                  fixed
                  bottom-24
                  left-4
                  z-[999]
                  overflow-hidden
                  rounded-2xl
                  shadow-2xl
                  sm:left-auto
                  sm:right-8
                "
              >
                <EmojiPicker
                  theme="auto"
                  onEmojiClick={
                    handleEmojiClick
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comments */}

      {comments.length === 0 ? (
        <div className="
          rounded-2xl
          border
          border-dashed
          border-slate-200
          px-5
          py-8
          text-center
          dark:border-slate-800
        ">
          <div className="
            mx-auto
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            text-slate-400
            dark:bg-slate-800
          ">
            <MessageCircle
              size={18}
            />
          </div>

          <p className="
            mt-3
            text-sm
            font-medium
          ">
            No comments yet
          </p>

          <p className="
            mt-1
            text-xs
            text-slate-400
          ">
            Start the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-1">

          {comments.map(
            (comment) => (
              <motion.div
                layout
                key={comment.id}
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  group
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  px-2
                  py-3
                  transition
                  hover:bg-slate-50
                  dark:hover:bg-slate-800/50
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                      `/profile/${comment.user_id}`
                  }
                  className="
                    shrink-0
                  "
                >
                  <Avatar
                    user={{
                      id: comment.user_id,
                      name: comment.author,
                      avatar_url:
                        comment.avatar_url,
                    }}
                    size="sm"
                  />
                </button>

                <div className="
                  min-w-0
                  flex-1
                ">
                  <div className="
                    flex
                    items-center
                    gap-2
                  ">
                    <button
                      type="button"
                      onClick={() =>
                        window.location.href =
                          `/profile/${comment.user_id}`
                      }
                      className="
                        truncate
                        text-sm
                        font-semibold
                        hover:underline
                      "
                    >
                      {comment.author}
                    </button>

                    <span className="
                      text-[10px]
                      text-slate-400
                    ">
                      •
                    </span>

                    <span className="
                      text-[10px]
                      text-slate-400
                    ">
                      student
                    </span>

                    {currentUser?.id ===
                      comment.user_id && (
                      <div className="
                        relative
                        ml-auto
                        shrink-0
                      ">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                comment.id
                                ? null
                                : comment.id
                            )
                          }
                          className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            opacity-0
                            transition
                            group-hover:opacity-100
                            hover:bg-slate-200
                            hover:text-slate-700
                            dark:hover:bg-slate-700
                            dark:hover:text-white
                          "
                        >
                          <MoreHorizontal
                            size={17}
                          />
                        </button>

                        <AnimatePresence>
                          {openMenu ===
                            comment.id && (
                            <motion.div
                              initial={{
                                opacity: 0,
                                scale: 0.97,
                                y: -4,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.97,
                                y: -4,
                              }}
                              className="
                                absolute
                                right-0
                                top-9
                                z-20
                                w-36
                                overflow-hidden
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                p-1
                                shadow-xl
                                dark:border-slate-800
                                dark:bg-slate-900
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.id
                                  )
                                }
                                className="
                                  flex
                                  w-full
                                  items-center
                                  gap-2
                                  rounded-lg
                                  px-3
                                  py-2
                                  text-xs
                                  font-medium
                                  text-red-600
                                  transition
                                  hover:bg-red-50
                                  dark:text-red-400
                                  dark:hover:bg-red-500/10
                                "
                              >
                                <Trash2
                                  size={14}
                                />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <p className="
                    mt-1
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-slate-600
                    dark:text-slate-300
                  ">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;