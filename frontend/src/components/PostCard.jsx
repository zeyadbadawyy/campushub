import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  X,
  Camera,
  Image as ImageIcon,
  MoreHorizontal,
  Send,
  Maximize2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import CommentSection from "./CommentSection";
import Avatar from "./Avatar";

import {
  toggleLike,
  updatePost,
  deletePost,
  uploadPostImage,
} from "../services/postService";

import { getCurrentUser } from "../services/auth";

import { useWebSocket } from "../contexts/WebSocketContext";

function PostCard({ post, onLike }) {
  const navigate = useNavigate();

  const { postLikes } = useWebSocket();

  const [currentUser, setCurrentUser] = useState(null);

  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const [editedContent, setEditedContent] = useState(
    post.content || ""
  );

  const [editedImage, setEditedImage] = useState(
    post.image_url || ""
  );

  const [editedGif, setEditedGif] = useState(
    post.gif_url || ""
  );

  const [showGifInput, setShowGifInput] = useState(false);

  const [liked, setLiked] = useState(
    post.liked_by_me || false
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getCurrentUser();
        setCurrentUser(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!postLikes.length) {
      return;
    }

    const latest = postLikes[0];

    if (latest.post_id !== post.id) {
      return;
    }

    if (latest.user_id === currentUser?.id) {
      setLiked(latest.liked);
    }
  }, [postLikes, post.id, currentUser]);

  async function handleLike() {
    try {
      await toggleLike(post.id);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleUpdate() {
    try {
      await updatePost(
        post.id,
        editedContent,
        editedImage,
        editedGif
      );

      setIsEditing(false);
      setShowMenu(false);

      onLike();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this post?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePost(post.id);

      setShowMenu(false);

      onLike();
    } catch (error) {
      console.error(error);
    }
  }

  function startEditing() {
    setEditedContent(post.content || "");
    setEditedImage(post.image_url || "");
    setEditedGif(post.gif_url || "");
    setShowGifInput(false);
    setShowMenu(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditedContent(post.content || "");
    setEditedImage(post.image_url || "");
    setEditedGif(post.gif_url || "");
    setShowGifInput(false);
    setIsEditing(false);
  }

  function handleEditImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    uploadPostImage(file)
      .then((result) => {
        setEditedGif("");
        setEditedImage(result.url);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function handleGifChange(event) {
    setEditedImage("");
    setEditedGif(event.target.value);
  }

  function handleProfileClick() {
    navigate(`/profile/${post.user_id}`);
  }

  const mediaUrl =
    post.image_url || post.gif_url || "";

  const isOwner =
    currentUser?.id === post.user_id;

  const postDate = post.created_at
    ? new Date(post.created_at)
    : null;

  const formattedDate = postDate
    ? postDate.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <>
      <motion.article
        layout
        className="
          overflow-hidden rounded-3xl
          border border-slate-200/80
          bg-white shadow-sm
          transition-shadow duration-200
          hover:shadow-md
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        {/* Header */}

        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <button
            type="button"
            onClick={handleProfileClick}
            className="
              flex min-w-0 items-center gap-3
              text-left
            "
          >
            <div className="shrink-0">
              <Avatar
                user={{
                  id: post.user_id,
                  name: post.author,
                  avatar_url: post.avatar_url,
                }}
                size="md"
              />
            </div>

            <div className="min-w-0">
              <h3
                className="
                  truncate text-sm font-semibold
                  text-slate-950
                  dark:text-white
                "
              >
                {post.author}
              </h3>

              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="
                  truncate text-xs
                  text-slate-500
                  dark:text-slate-400
                ">
                  {post.faculty || "CampusHub User"}
                </p>

                {formattedDate && (
                  <>
                    <span className="
                      text-xs text-slate-300
                      dark:text-slate-600
                    ">
                      •
                    </span>

                    <p className="
                      shrink-0 text-xs
                      text-slate-400
                    ">
                      {formattedDate}
                    </p>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Post menu */}

          {isOwner && !isEditing && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setShowMenu((prev) => !prev)
                }
                className="
                  flex h-9 w-9 items-center
                  justify-center rounded-xl
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  dark:hover:bg-slate-800
                  dark:hover:text-slate-200
                "
              >
                <MoreHorizontal size={19} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.96,
                      y: -4,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      y: -4,
                    }}
                    className="
                      absolute right-0 top-11 z-20
                      w-44 overflow-hidden
                      rounded-2xl border
                      border-slate-200
                      bg-white p-1.5
                      shadow-xl
                      dark:border-slate-800
                      dark:bg-slate-900
                    "
                  >
                    <button
                      type="button"
                      onClick={startEditing}
                      className="
                        flex w-full items-center
                        gap-3 rounded-xl px-3 py-2.5
                        text-sm font-medium
                        transition
                        hover:bg-slate-100
                        dark:hover:bg-slate-800
                      "
                    >
                      <Pencil size={16} />
                      Edit post
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="
                        flex w-full items-center
                        gap-3 rounded-xl px-3 py-2.5
                        text-sm font-medium
                        text-red-600
                        transition
                        hover:bg-red-50
                        dark:text-red-400
                        dark:hover:bg-red-500/10
                      "
                    >
                      <Trash2 size={16} />
                      Delete post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Content */}

        <div className="px-5 pt-5 sm:px-6">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
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
                  y: -6,
                }}
              >
                {/* Edit textarea */}

                <textarea
                  value={editedContent}
                  onChange={(e) =>
                    setEditedContent(
                      e.target.value
                    )
                  }
                  rows={5}
                  className="
                    min-h-[130px] w-full resize-none
                    rounded-2xl
                    border border-slate-200
                    bg-slate-50 p-4
                    text-sm leading-6
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:focus:bg-slate-950
                  "
                />

                {/* Edit media preview */}

                {(editedImage || editedGif) && (
                  <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={
                        editedImage ||
                        editedGif
                      }
                      alt="Preview"
                      className="
                        max-h-[360px] w-full
                        object-cover
                      "
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setEditedImage("");
                        setEditedGif("");
                      }}
                      className="
                        absolute right-3 top-3
                        flex h-8 w-8
                        items-center justify-center
                        rounded-full bg-black/60
                        text-white backdrop-blur-md
                        transition
                        hover:bg-black/80
                      "
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Edit media actions */}

                <div className="
                  mt-3 flex flex-wrap
                  items-center gap-2
                ">
                  <label
                    className="
                      inline-flex cursor-pointer
                      items-center gap-2
                      rounded-xl border
                      border-slate-200
                      px-3 py-2 text-xs
                      font-medium
                      text-slate-600
                      transition
                      hover:bg-slate-50
                      dark:border-slate-700
                      dark:text-slate-300
                      dark:hover:bg-slate-800
                    "
                  >
                    <Camera size={15} />
                    {editedImage
                      ? "Change photo"
                      : "Add photo"}

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleEditImage}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowGifInput(
                        (prev) => !prev
                      )
                    }
                    className="
                      inline-flex items-center gap-2
                      rounded-xl border
                      border-slate-200
                      px-3 py-2 text-xs
                      font-medium
                      text-slate-600
                      transition
                      hover:bg-slate-50
                      dark:border-slate-700
                      dark:text-slate-300
                      dark:hover:bg-slate-800
                    "
                  >
                    <ImageIcon size={15} />
                    GIF
                  </button>
                </div>

                {showGifInput && (
                  <input
                    type="text"
                    value={editedGif}
                    onChange={handleGifChange}
                    placeholder="Paste GIF URL..."
                    className="
                      mt-3 h-11 w-full
                      rounded-xl
                      border border-slate-200
                      bg-slate-50 px-3
                      text-sm outline-none
                      transition
                      focus:border-indigo-500
                      focus:bg-white
                      dark:border-slate-700
                      dark:bg-slate-950
                    "
                  />
                )}

                {/* Edit controls */}

                <div className="
                  mt-4 flex justify-end gap-2
                ">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="
                      rounded-xl px-4 py-2.5
                      text-sm font-medium
                      text-slate-600
                      transition
                      hover:bg-slate-100
                      dark:text-slate-300
                      dark:hover:bg-slate-800
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="
                      inline-flex items-center
                      gap-2 rounded-xl
                      bg-indigo-600 px-4 py-2.5
                      text-sm font-semibold
                      text-white
                      transition
                      hover:bg-indigo-700
                    "
                  >
                    <Send size={15} />
                    Save changes
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
              >
                {/* Text */}

                {post.content && (
                  <p className="
                    whitespace-pre-wrap
                    break-words text-[15px]
                    leading-7
                    text-slate-700
                    dark:text-slate-200
                  ">
                    {post.content}
                  </p>
                )}

                {/* Media */}

                {mediaUrl && (
                  <div
                    className={`
                      group relative overflow-hidden
                      rounded-2xl border
                      border-slate-200
                      dark:border-slate-800
                      ${
                        post.content
                          ? "mt-4"
                          : ""
                      }
                    `}
                  >
                    <img
                      src={mediaUrl}
                      alt="Post"
                      className="
                        block max-h-[600px]
                        w-full cursor-pointer
                        object-cover
                        transition duration-300
                        group-hover:scale-[1.01]
                      "
                      onClick={() =>
                        setShowImage(true)
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowImage(true)
                      }
                      className="
                        absolute bottom-3 right-3
                        flex h-9 w-9
                        items-center justify-center
                        rounded-xl
                        bg-black/55
                        text-white
                        opacity-0
                        backdrop-blur-sm
                        transition
                        group-hover:opacity-100
                      "
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}

        <div className="px-5 pt-4 sm:px-6">
          <div className="
            flex items-center
            justify-between
            text-xs
            text-slate-400
          ">
            <span>
              {post.likes || 0}{" "}
              {post.likes === 1
                ? "like"
                : "likes"}
            </span>

            <button
              type="button"
              onClick={() =>
                setShowComments(
                  (prev) => !prev
                )
              }
              className="
                transition
                hover:text-slate-700
                dark:hover:text-slate-200
              "
            >
              {post.comments || 0}{" "}
              {post.comments === 1
                ? "comment"
                : "comments"}
            </button>
          </div>
        </div>

        {/* Divider */}

        <div className="
          mx-5 mt-4 border-t
          border-slate-100
          dark:border-slate-800
          sm:mx-6
        " />

        {/* Actions */}

        <div className="
          flex items-center gap-1
          px-3 py-2 sm:px-4
        ">
          <button
            type="button"
            onClick={handleLike}
            className={`
              flex flex-1 items-center
              justify-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-medium
              transition
              ${
                liked
                  ? `
                    bg-red-50
                    text-red-600
                    dark:bg-red-500/10
                    dark:text-red-400
                  `
                  : `
                    text-slate-500
                    hover:bg-slate-100
                    hover:text-slate-800
                    dark:text-slate-400
                    dark:hover:bg-slate-800
                    dark:hover:text-slate-200
                  `
              }
            `}
          >
            <Heart
              size={18}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />

            <span>
              Like
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowComments(
                (prev) => !prev
              )
            }
            className="
              flex flex-1 items-center
              justify-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-medium
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-800
              dark:text-slate-400
              dark:hover:bg-slate-800
              dark:hover:text-slate-200
            "
          >
            <MessageCircle size={18} />
            <span>
              Comment
            </span>
          </button>
        </div>

        {/* Comments */}

        <AnimatePresence initial={false}>
          {showComments && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="
                overflow-hidden
                border-t border-slate-100
                dark:border-slate-800
              "
            >
              <div className="p-5 sm:p-6">
                <CommentSection
                  postId={post.id}
                  onCommentAdded={onLike}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* Fullscreen image */}

      <AnimatePresence>
        {showImage && mediaUrl && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setShowImage(false)
            }
            className="
              fixed inset-0 z-[100]
              flex items-center justify-center
              bg-slate-950/80 p-4
              backdrop-blur-md
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
              }}
              className="
                relative max-h-[92vh]
                max-w-[95vw]
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <img
                src={mediaUrl}
                alt="Post fullscreen"
                className="
                  max-h-[92vh]
                  max-w-[95vw]
                  rounded-2xl
                  object-contain
                  shadow-2xl
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowImage(false)
                }
                className="
                  absolute right-3 top-3
                  flex h-10 w-10
                  items-center justify-center
                  rounded-full
                  bg-black/60
                  text-white
                  backdrop-blur-md
                  transition
                  hover:bg-black/80
                "
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PostCard;