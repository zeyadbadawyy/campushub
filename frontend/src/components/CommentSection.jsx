import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import { createPortal } from "react-dom";

import {
  Smile,
  Send,
  MoreHorizontal,
  Trash2,
  MessageCircle,
  X,
} from "lucide-react";

import EmojiPicker from "emoji-picker-react";

import {
  getComments,
  createComment,
  getUserProfile,
  deleteComment,
  searchGifs,
  searchMentionUsers,
} from "../services/postService";

import {
  getCurrentUser,
} from "../services/auth";

import Avatar from "./Avatar";
import MentionText from "./MentionText";

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

  const [gifUrl, setGifUrl] =
    useState("");

  const [showGifPicker, setShowGifPicker] =
    useState(false);

  const [gifSearch, setGifSearch] =
    useState("");

  const [gifResults, setGifResults] =
    useState([]);

  const [gifLoading, setGifLoading] =
    useState(false);

  const [mentionQuery, setMentionQuery] =
    useState(null);

  const [mentionUsers, setMentionUsers] =
    useState([]);

  const [mentionIndex, setMentionIndex] =
    useState(0);

  const [mentions, setMentions] =
    useState([]);

  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  const [mentionMenuPosition, setMentionMenuPosition] =
    useState(null);

  const {
    comments: wsComments,
  } = useWebSocket();

  useEffect(() => {
    const query = gifSearch.trim();

    if (!showGifPicker || !query) {
      setGifResults([]);
      return;
    }

    const timer =
      setTimeout(async () => {
        try {
          setGifLoading(true);

          const results =
            await searchGifs(query);

          setGifResults(results || []);
        } catch (error) {
          console.error(error);
          setGifResults([]);
        } finally {
          setGifLoading(false);
        }
      }, 300);

    return () => clearTimeout(timer);
  }, [
    gifSearch,
    showGifPicker,
  ]);

  useEffect(() => {
    if (!mentionQuery || !inputRef.current) {
      setMentionMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const top = rect.bottom + 8;
      const availableBelow = Math.max(120, window.innerHeight - top - 16);

      setMentionMenuPosition({
        top,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.min(rect.width, window.innerWidth - 16) - 8)),
        width: Math.min(rect.width, window.innerWidth - 16),
        maxHeight: Math.min(320, availableBelow),
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mentionQuery]);

  useEffect(() => {
    if (mentionQuery === null) {
      setMentionUsers([]);
      setMentionIndex(0);
      return;
    }

    const timer =
      setTimeout(async () => {
        try {
          const users =
            await searchMentionUsers(
              mentionQuery.query
            );

          setMentionUsers(users || []);
          setMentionIndex(0);
        } catch (error) {
          console.error(error);
          setMentionUsers([]);
          setMentionIndex(0);
        }
      }, 180);

    return () => clearTimeout(timer);
  }, [mentionQuery]);

  function getMentionContext(
    value,
    cursorPosition
  ) {
    const before = value.slice(
      0,
      cursorPosition
    );

    const match = before.match(
      /(^|\s)@([^\s@]*)$/
    );

    if (!match) {
      return null;
    }

    return {
      query: match[2],
      start: before.lastIndexOf("@"),
    };
  }

  function handleContentChange(event) {
    const value = event.target.value;

    setContent(value);

    const context =
      getMentionContext(
        value,
        event.target.selectionStart
      );

    setMentionQuery(context);
  }

  function handleMentionSelect(user) {
    const input = inputRef.current;

    if (!input || !mentionQuery) {
      return;
    }

    const cursor = input.selectionStart;

    const before = content.slice(
      0,
      mentionQuery.start
    );

    const after = content.slice(cursor);

    const nextValue =
      `${before}@${user.name} ${after}`;

    setContent(nextValue);

    setMentions((prev) => {
      if (
        prev.some(
          (mention) => mention.id === user.id
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        {
          id: user.id,
          name: user.name,
        },
      ];
    });

    setMentionQuery(null);
    setMentionUsers([]);
    setMentionIndex(0);

    requestAnimationFrame(() => {
      const nextCursor =
        before.length + user.name.length + 2;

      input.focus();
      input.setSelectionRange(
        nextCursor,
        nextCursor
      );
    });
  }

  function handleContentKeyDown(event) {
    if (
      mentionQuery &&
      mentionUsers.length > 0
    ) {
      if (event.key === "ArrowDown") {
        event.preventDefault();

        setMentionIndex((prev) =>
          Math.min(
            prev + 1,
            mentionUsers.length - 1
          )
        );

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setMentionIndex((prev) =>
          Math.max(prev - 1, 0)
        );

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        handleMentionSelect(
          mentionUsers[mentionIndex]
        );

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleComment();
    }
  }

  function handleGifSelect(gif) {
    const url =
      gif?.images?.original?.url ||
      gif?.images?.fixed_height?.url ||
      "";

    if (!url) {
      return;
    }

    setGifUrl(url);
    setShowGifPicker(false);
    setGifSearch("");
    setGifResults([]);
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
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

      setComments(commentsWithUsers);
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

    const newest = wsComments[0];

    if (newest.post_id !== postId) {
      return;
    }

    setComments((prev) => {
      const exists = prev.some(
        (comment) =>
          comment.id === newest.id
      );

      if (exists) {
        return prev;
      }

      return [
        {
          ...newest,
          avatar_url:
            newest.avatar_url || null,
        },
        ...prev,
      ];
    });
  }, [
    wsComments,
    postId,
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target
        )
      ) {
        setShowEmojiPicker(false);
        setShowGifPicker(false);
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
    if (
      (!content.trim() && !gifUrl) ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const mentionIds = mentions
        .filter((mention) =>
          content.includes(`@${mention.name}`)
        )
        .map((mention) => mention.id);

      await createComment(
        postId,
        content.trim(),
        gifUrl,
        mentionIds
      );

      setContent("");
      setMentions([]);
      setMentionQuery(null);
      setMentionUsers([]);
      setMentionIndex(0);
      setShowEmojiPicker(false);
      setGifUrl("");
      setShowGifPicker(false);
      setGifSearch("");
      setGifResults([]);
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
      await deleteComment(commentId);

      setOpenMenu(null);

      await loadComments();

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleEmojiClick(emojiData) {
    setContent(
      (prev) => prev + emojiData.emoji
    );

    inputRef.current?.focus();
  }

  return (
    <div className="relative space-y-4 overflow-visible">
      {/* Composer */}

      <div className="flex items-end gap-2">
        <div className="shrink-0">
          <Avatar
            user={currentUser}
            size="sm"
          />
        </div>

        <div className="relative flex-1">
          {/* Selected GIF preview */}

          <AnimatePresence>
            {gifUrl && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 6,
                }}
                className="
                  absolute
                  bottom-full
                  left-0
                  z-[998]
                  mb-2
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-1.5
                  shadow-xl
                  dark:border-slate-700
                  dark:bg-slate-900
                "
              >
                <div className="relative">
                  <img
                    src={gifUrl}
                    alt=""
                    className="
                      h-24
                      w-36
                      rounded-xl
                      object-cover
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setGifUrl("")
                    }
                    className="
                      absolute
                      right-1.5
                      top-1.5
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      bg-black/60
                      text-white
                      backdrop-blur-sm
                      transition
                      hover:bg-black/80
                    "
                    aria-label="Remove GIF"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              onChange={handleContentChange}
              onKeyDown={handleContentKeyDown}
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

            {/* Emoji + GIF controls */}

            <div
              ref={pickerRef}
              className="
                relative
                flex
                shrink-0
                items-center
                gap-1
              "
            >
              {/* Emoji */}

              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(
                    (prev) => !prev
                  );
                  setShowGifPicker(false);
                }}
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
                aria-label="Emoji"
              >
                <Smile size={17} />
              </button>

              {/* GIF */}

              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(
                    (prev) => !prev
                  );
                  setShowEmojiPicker(false);
                  setMentionQuery(null);
                }}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  text-xs
                  font-bold
                  text-slate-400
                  transition
                  hover:bg-indigo-50
                  hover:text-indigo-600
                  dark:hover:bg-indigo-500/10
                  dark:hover:text-indigo-400
                "
                aria-label="GIFs"
              >
                GIF
              </button>

              {/* Emoji picker */}

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
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

              {/* GIF picker */}

              <AnimatePresence>
                {showGifPicker && (
                  <motion.div
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
                      bottom-40
                      left-4
                      z-[999]
                      sm:left-auto
                      sm:right-8
                      w-[min(20rem,calc(100vw-2rem))]
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-2xl
                      dark:border-slate-700
                      dark:bg-slate-900
                    "
                  >
                    <div className="p-3">
                      <input
                        type="text"
                        autoFocus
                        value={gifSearch}
                        onChange={(e) =>
                          setGifSearch(
                            e.target.value
                          )
                        }
                        placeholder="Search GIFs..."
                        className="
                          h-10
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-3
                          text-sm
                          outline-none
                          focus:border-indigo-500
                          focus:ring-4
                          focus:ring-indigo-500/10
                          dark:border-slate-700
                          dark:bg-slate-950
                        "
                      />
                    </div>

                    <div className="
                      grid
                      max-h-72
                      grid-cols-2
                      gap-2
                      overflow-y-auto
                      p-3
                    ">
                      {gifLoading ? (
                        <div className="
                          col-span-2
                          py-8
                          text-center
                          text-sm
                          text-slate-400
                        ">
                          Searching...
                        </div>
                      ) : gifResults.length > 0 ? (
                        gifResults.map(
                          (gif) => (
                            <button
                              key={gif.id}
                              type="button"
                              onClick={() =>
                                handleGifSelect(
                                  gif
                                )
                              }
                              className="
                                overflow-hidden
                                rounded-xl
                                bg-slate-100
                                dark:bg-slate-800
                              "
                            >
                              <img
                                src={
                                  gif.images?.fixed_width?.url ||
                                  gif.images?.original?.url
                                }
                                alt=""
                                className="
                                  h-28
                                  w-full
                                  object-cover
                                  transition
                                  hover:scale-[1.03]
                                "
                              />
                            </button>
                          )
                        )
                      ) : gifSearch ? (
                        <div className="
                          col-span-2
                          py-8
                          text-center
                          text-sm
                          text-slate-400
                        ">
                          No GIFs found
                        </div>
                      ) : (
                        <div className="
                          col-span-2
                          py-8
                          text-center
                          text-sm
                          text-slate-400
                        ">
                          Search for a GIF
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Send */}

            <button
              type="button"
              onClick={handleComment}
              disabled={
                submitting ||
                (!content.trim() && !gifUrl)
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
        </div>
      </div>
      {mentionQuery &&
        mentionMenuPosition &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
              }}
              style={{
                position: "fixed",
                top: mentionMenuPosition.top,
                left: mentionMenuPosition.left,
                width: mentionMenuPosition.width,
              }}
              className="
                z-[10000]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              {mentionUsers.length > 0 ? (
                <div className="p-1.5">
                  {mentionUsers.map((user, index) => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={() =>
                        handleMentionSelect(user)
                      }
                      className={`
                        flex w-full items-center
                        gap-3 rounded-xl px-3 py-2.5
                        text-left transition
                        ${
                          index === mentionIndex
                            ? `
                              bg-indigo-50
                              dark:bg-indigo-500/10
                            `
                            : `
                              hover:bg-slate-100
                              dark:hover:bg-slate-800
                            `
                        }
                      `}
                    >
                      <Avatar user={user} size="sm" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {user.faculty ||
                            "CampusHub User"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-center text-xs text-slate-400">
                  No users found
                </div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

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
            <MessageCircle size={18} />
          </div>

          <p className="mt-3 text-sm font-medium">
            No comments yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Start the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
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
                className="shrink-0"
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

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
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

                  <span className="text-[10px] text-slate-400">
                    •
                  </span>

                  <span className="text-[10px] text-slate-400">
                    student
                  </span>

                  {currentUser?.id ===
                    comment.user_id && (
                    <div className="relative ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === comment.id
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
                        <MoreHorizontal size={17} />
                      </button>

                      <AnimatePresence>
                        {openMenu === comment.id && (
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
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {comment.content && (
                  <p className="
                    mt-1
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-slate-600
                    dark:text-slate-300
                  ">
                    <MentionText
                      text={comment.content}
                      mentions={comment.mentions || []}
                    />
                  </p>
                )}

                {comment.gif_url && (
                  <img
                    src={comment.gif_url}
                    alt=""
                    className="
                      mt-2
                      max-h-[240px]
                      max-w-[280px]
                      rounded-xl
                      object-cover
                    "
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
