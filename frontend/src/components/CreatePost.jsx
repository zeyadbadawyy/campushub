import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Image as ImageIcon,
  Smile,
  X,
  Flame,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";

import EmojiPicker from "emoji-picker-react";

import { Button } from "./ui/button";

import {
  createPost,
  uploadPostImage,
  searchGifs,
} from "../services/postService";

function CreatePost({ onPostCreated }) {
  const fileInputRef = useRef(null);
  const pickerRef = useRef(null);

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [gifUrl, setGifUrl] = useState("");
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifInput, setShowGifInput] = useState(false);
  const [showGiphy, setShowGiphy] = useState(false);

  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);

  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const gifs = await searchGifs(gifSearch);
        setGifResults(gifs || []);
      } catch (error) {
        console.error(error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [gifSearch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
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

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleEmojiClick(emojiData) {
    setContent((prev) => prev + emojiData.emoji);
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setGifUrl("");
    setShowGifInput(false);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  }

  function removeImage() {
    setImage(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeGif() {
    setGifUrl("");
  }

  function handleGifUrlChange(event) {
    const value = event.target.value;

    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setGifUrl(value);
  }

  function closeGiphy() {
    setShowGiphy(false);
    setGifSearch("");
    setGifResults([]);
  }

  async function handleSubmit() {
    if (
      !content.trim() &&
      !image &&
      !gifUrl.trim()
    ) {
      return;
    }

    try {
      setLoading(true);

      let imageUrl = "";

      if (image) {
        const uploadResult =
          await uploadPostImage(image);

        imageUrl = uploadResult.url;
      }

      await createPost(
        content,
        imageUrl,
        gifUrl
      );

      setContent("");
      setImage(null);
      setGifUrl("");
      setPreview("");
      setShowEmojiPicker(false);
      setShowGifInput(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onPostCreated();
    } catch (error) {
      console.error(error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  const hasAttachment =
    Boolean(preview || gifUrl);

  return (
    <>
      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          relative overflow-visible rounded-3xl
          border border-slate-200/80
          bg-white shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div className="p-5 sm:p-6">

          {/* Header */}

          <div className="mb-5 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center
                justify-center rounded-2xl
                bg-indigo-50 text-indigo-600
                dark:bg-indigo-500/10
                dark:text-indigo-400
              "
            >
              <Sparkles size={19} />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Create a post
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share something with your campus
              </p>
            </div>
          </div>

          {/* Composer */}

          <div
            className="
              rounded-2xl border border-slate-200
              bg-slate-50/70
              p-4 transition
              focus-within:border-indigo-400
              focus-within:bg-white
              focus-within:ring-4
              focus-within:ring-indigo-500/5
              dark:border-slate-800
              dark:bg-slate-950/50
              dark:focus-within:bg-slate-950
            "
          >
            <textarea
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="What's happening on campus?"
              rows={3}
              className="
                min-h-[84px] w-full resize-none
                border-0 bg-transparent
                text-sm leading-6 outline-none
                placeholder:text-slate-400
              "
            />

            {/* Attachment preview */}

            <AnimatePresence>
              {hasAttachment && (
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
                  className="overflow-hidden"
                >
                  <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={preview || gifUrl}
                      alt="Post preview"
                      className="
                        max-h-[360px] w-full
                        object-cover
                      "
                    />

                    <button
                      type="button"
                      onClick={
                        preview
                          ? removeImage
                          : removeGif
                      }
                      className="
                        absolute right-3 top-3
                        flex h-8 w-8 items-center
                        justify-center rounded-full
                        bg-black/60 text-white
                        backdrop-blur-md
                        transition hover:bg-black/80
                      "
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GIF URL */}

            <AnimatePresence>
              {showGifInput && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="mt-3"
                >
                  <input
                    type="text"
                    value={gifUrl}
                    onChange={
                      handleGifUrlChange
                    }
                    placeholder="Paste a GIF URL..."
                    className="
                      h-11 w-full rounded-xl
                      border border-slate-200
                      bg-white px-3
                      text-sm outline-none
                      transition
                      focus:border-indigo-500
                      focus:ring-4
                      focus:ring-indigo-500/10
                      dark:border-slate-700
                      dark:bg-slate-900
                    "
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom actions */}

            <div className="
              mt-4 flex flex-wrap
              items-center justify-between
              gap-3
            ">
              <div className="flex flex-wrap items-center gap-1.5">

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageSelect}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="
                    rounded-xl text-slate-500
                    hover:bg-indigo-50
                    hover:text-indigo-600
                    dark:hover:bg-indigo-500/10
                    dark:hover:text-indigo-400
                  "
                >
                  <Camera size={17} />
                  Photo
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShowGifInput(
                      (prev) => !prev
                    )
                  }
                  className="
                    rounded-xl text-slate-500
                    hover:bg-violet-50
                    hover:text-violet-600
                    dark:hover:bg-violet-500/10
                    dark:hover:text-violet-400
                  "
                >
                  <ImageIcon size={17} />
                  GIF
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShowGiphy(true)
                  }
                  className="
                    rounded-xl text-slate-500
                    hover:bg-orange-50
                    hover:text-orange-600
                    dark:hover:bg-orange-500/10
                    dark:hover:text-orange-400
                  "
                >
                  <Flame size={17} />
                  Giphy
                </Button>

                <div
                  ref={pickerRef}
                  className="relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowEmojiPicker(
                        (prev) => !prev
                      )
                    }
                    className="
                      rounded-xl text-slate-500
                      hover:bg-amber-50
                      hover:text-amber-600
                      dark:hover:bg-amber-500/10
                      dark:hover:text-amber-400
                    "
                  >
                    <Smile size={17} />
                    Emoji
                  </Button>

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
                          absolute bottom-12 left-0
                          z-50 overflow-hidden
                          rounded-2xl shadow-2xl
                        "
                      >
                        <EmojiPicker
                          theme={
                            "auto"
                          }
                          onEmojiClick={
                            handleEmojiClick
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (
                    !content.trim() &&
                    !image &&
                    !gifUrl.trim()
                  )
                }
                className="
                  rounded-xl px-5
                  bg-indigo-600 text-white
                  shadow-sm
                  hover:bg-indigo-700
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Giphy modal */}

      <AnimatePresence>
        {showGiphy && (
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
            onClick={closeGiphy}
            className="
              fixed inset-0 z-[100]
              flex items-center justify-center
              bg-slate-950/60 p-4
              backdrop-blur-sm
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="
                flex max-h-[80vh]
                w-full max-w-2xl
                flex-col overflow-hidden
                rounded-3xl border
                border-slate-200
                bg-white shadow-2xl
                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex items-center gap-3
                  border-b border-slate-200
                  p-4
                  dark:border-slate-800
                "
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) =>
                      setGifSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search GIFs..."
                    autoFocus
                    className="
                      h-11 w-full rounded-xl
                      border border-slate-200
                      bg-slate-50 px-3
                      text-sm outline-none
                      focus:border-indigo-500
                      focus:ring-4
                      focus:ring-indigo-500/10
                      dark:border-slate-700
                      dark:bg-slate-950
                    "
                  />
                </div>

                <button
                  type="button"
                  onClick={closeGiphy}
                  className="
                    flex h-10 w-10
                    shrink-0 items-center
                    justify-center
                    rounded-xl
                    text-slate-500
                    transition
                    hover:bg-slate-100
                    dark:hover:bg-slate-800
                  "
                >
                  <X size={19} />
                </button>
              </div>

              <div
                className="
                  grid
                  max-h-[60vh]
                  flex-1
                  grid-cols-2
                  gap-3
                  overflow-y-auto
                  p-4
                  sm:grid-cols-3
                  md:grid-cols-4
                  custom-scrollbar
                "
              >
                {gifResults.length > 0 ? (
                  gifResults.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={() => {
                        setGifUrl(
                          gif.images.original.url
                        );
                        setImage(null);
                        setPreview("");
                        setShowGifInput(false);
                        closeGiphy();
                      }}
                      className="
                        overflow-hidden
                        rounded-2xl
                        bg-slate-100
                        transition
                        hover:scale-[1.02]
                        dark:bg-slate-800
                      "
                    >
                      <img
                        src={gif.images.fixed_height.url}
                        alt=""
                        className="
                          aspect-square
                          h-full
                          w-full
                          object-cover
                        "
                      />
                    </button>
                  ))
                ) : (
                  <div
                    className="
                      col-span-full
                      flex min-h-[280px]
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <div>
                      <Flame
                        size={30}
                        className="
                          mx-auto
                          text-slate-300
                          dark:text-slate-700
                        "
                      />

                      <p className="mt-3 text-sm font-medium">
                        Search for a GIF
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Find something to match
                        the vibe.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CreatePost;