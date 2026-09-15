import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Plus,
  X,
  Send,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Type,
  Palette,
  RotateCcw,
} from "lucide-react";

import Avatar from "./Avatar";
import UserListModal from "./UserListModal";

import {
  getStories,
  createStory,
  uploadStoryImage,
  viewStory,
  deleteStory,
  getStoryViewers,
} from "../services/postService";

const STORY_DURATION = 5000;

const STORY_BACKGROUNDS = [
  {
    name: "Violet",
    className:
      "bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600",
  },
  {
    name: "Sunset",
    className:
      "bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600",
  },
  {
    name: "Ocean",
    className:
      "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700",
  },
  {
    name: "Emerald",
    className:
      "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700",
  },
  {
    name: "Midnight",
    className:
      "bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-950",
  },
];

const TEXT_STYLES = {
  classic: {
    label: "Classic",
    className:
      "font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)]",
  },

  box: {
    label: "Box",
    className:
      "rounded-2xl bg-black/55 px-5 py-4 font-bold text-white backdrop-blur-md",
  },

  glass: {
    label: "Glass",
    className:
      "rounded-2xl border border-white/20 bg-white/15 px-5 py-4 font-bold text-white backdrop-blur-xl",
  },
};

function formatStoryAge(createdAt) {
  const timestamp =
    new Date(createdAt).getTime();

  const difference = Math.max(
    0,
    Date.now() - timestamp
  );

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days}d ago`;
}

/*
 * ============================================================
 * STORY STYLING
 * ============================================================
 */

function getStoryStyling(story) {
  return {
    text_style:
      story?.styling?.text_style ||
      "classic",

    text_size:
      Number(
        story?.styling?.text_size
      ) || 32,

    text_x:
      Number(
        story?.styling?.text_x
      ) || 0,

    text_y:
      Number(
        story?.styling?.text_y
      ) || 0,

    background_index:
      Number(
        story?.styling?.background_index
      ) || 0,
  };
}

/*
 * ============================================================
 * STORY PHOTO
 * ============================================================
 *
 * Full source image is always preserved.
 *
 * Background:
 * blurred cover
 *
 * Foreground:
 * full source image using contain
 */

function StoryPhoto({ src }) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={src}
          alt=""
          draggable="false"
          className="
            absolute
            inset-0
            h-full
            w-full
            scale-110
            object-cover
            opacity-70
            blur-3xl
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-black/20
          "
        />
      </div>

      <div
        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
        "
      >
        <img
          src={src}
          alt=""
          draggable="false"
          className="
            h-full
            w-full
            object-contain
          "
        />
      </div>

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-black/15
          via-transparent
          to-black/45
        "
      />
    </>
  );
}

/*
 * ============================================================
 * STORY TEXT
 * ============================================================
 *
 * IMPORTANT POSITIONING MODEL
 *
 * x = 0
 * y = 0
 *
 * means EXACT center.
 *
 * The OUTER element owns the saved position.
 *
 * The INNER motion element owns temporary drag movement.
 *
 * After every drag:
 *   1. calculate the new saved position
 *   2. update React state
 *   3. remount the inner motion element
 *   4. Framer Motion's old transform is gone
 *
 * Therefore no double-transform.
 */

function StoryText({
  content,
  textStyle,
  textSize,
  textX,
  textY,
  draggable = false,
  canvasRef = null,
  onPositionChange = null,
  dragVersion = 0,
}) {
  if (!content?.trim()) {
    return null;
  }

  const style =
    TEXT_STYLES[textStyle] ||
    TEXT_STYLES.classic;

  function handleDragEnd(
    event,
    info
  ) {
    if (
      !draggable ||
      !canvasRef?.current ||
      !onPositionChange
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    if (
      !rect.width ||
      !rect.height
    ) {
      return;
    }

    const deltaX =
      (info.offset.x /
        rect.width) *
      100;

    const deltaY =
      (info.offset.y /
        rect.height) *
      100;

    onPositionChange(
      (previous) => {
        let nextX =
          previous.x + deltaX;

        let nextY =
          previous.y + deltaY;

        /*
         * Tiny center snap.
         *
         * If the user drops very close
         * to the center, snap exactly
         * to 0,0.
         */

        if (
          Math.abs(nextX) < 1.75
        ) {
          nextX = 0;
        }

        if (
          Math.abs(nextY) < 1.75
        ) {
          nextY = 0;
        }

        return {
          x: Math.max(
            -40,
            Math.min(
              40,
              nextX
            )
          ),

          y: Math.max(
            -40,
            Math.min(
              40,
              nextY
            )
          ),
        };
      }
    );
  }

  return (
    /*
     * OUTER POSITION CONTAINER
     *
     * This is controlled ONLY by React state.
     */
    <div
      className="
        absolute
        z-20
        max-w-[88%]
      "
      style={{
        left: `${50 + textX}%`,
        top: `${50 + textY}%`,
        transform:
          "translate(-50%, -50%)",
      }}
    >
      {/*
       * INNER DRAG CONTAINER
       *
       * key changes after every completed
       * drag/center operation, so Framer's
       * internal transform is completely reset.
       */}
      <motion.div
        key={
          draggable
            ? dragVersion
            : "viewer"
        }
        drag={draggable}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={
          draggable
            ? handleDragEnd
            : undefined
        }
        className={`
          text-center
          ${
            draggable
              ? "cursor-grab active:cursor-grabbing"
              : "pointer-events-none"
          }
        `}
      >
        <div
          className={
            style.className
          }
        >
          <span
            className="
              block
              whitespace-pre-wrap
            "
            style={{
              fontSize: `${textSize}px`,
              lineHeight: 1.12,
            }}
          >
            {content}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/*
 * ============================================================
 * STORY VISUAL
 * ============================================================
 */

function StoryVisual({
  story,
  className = "",
}) {
  const styling =
    getStoryStyling(story);

  const background =
    STORY_BACKGROUNDS[
      styling.background_index %
        STORY_BACKGROUNDS.length
    ];

  return (
    <div
      className={`
        relative
        h-full
        w-full
        overflow-hidden
        ${className}
      `}
    >
      {story.media_url ? (
        <StoryPhoto
          src={story.media_url}
        />
      ) : (
        <div
          className={`
            absolute
            inset-0
            ${background.className}
          `}
        />
      )}

      <StoryText
        content={story.content}
        textStyle={
          styling.text_style
        }
        textSize={
          styling.text_size
        }
        textX={
          styling.text_x
        }
        textY={
          styling.text_y
        }
      />
    </div>
  );
}

/*
 * ============================================================
 * STORY BAR
 * ============================================================
 */

function StoryBar() {
  const [stories, setStories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * ==========================================================
   * CREATE EDITOR
   * ==========================================================
   */

  const [showCreate, setShowCreate] =
    useState(false);

  const [content, setContent] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [
    editorBackground,
    setEditorBackground,
  ] = useState(0);

  const [textStyle, setTextStyle] =
    useState("classic");

  const [textSize, setTextSize] =
    useState(32);

  /*
   * x/y are percentage offsets
   * from the exact center.
   *
   * 0,0 = center
   */
  const [textOffset, setTextOffset] =
    useState({
      x: 0,
      y: 0,
    });

  /*
   * Increment this whenever the
   * editor position changes.
   *
   * This forces the inner Framer
   * drag layer to remount and lose
   * its previous transform.
   */
  const [textDragVersion, setTextDragVersion] =
    useState(0);

  const editorCanvasRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /*
   * ==========================================================
   * VIEWER
   * ==========================================================
   */

  const [
    activeUserIndex,
    setActiveUserIndex,
  ] = useState(null);

  const [
    activeStoryIndex,
    setActiveStoryIndex,
  ] = useState(null);

  const [
    progressMs,
    setProgressMs,
  ] = useState(0);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  const [
    swipeDirection,
    setSwipeDirection,
  ] = useState(1);

  const [showStoryViewers, setShowStoryViewers] = useState(false);
  const [storyViewers, setStoryViewers] = useState([]);

  const progressRef =
    useRef(0);

  /*
   * ==========================================================
   * GROUP STORIES
   * ==========================================================
   */

  const storyGroups = useMemo(() => {
    const groups = new Map();

    for (const story of stories) {
      if (!groups.has(story.user_id)) {
        groups.set(
          story.user_id,
          {
            user_id:
              story.user_id,
            author:
              story.author,
            avatar_url:
              story.avatar_url,
            stories: [],
            is_owner:
              Boolean(
                story.is_owner
              ),
          }
        );
      }

      groups
        .get(story.user_id)
        .stories.push(story);
    }

    const result =
      Array.from(
        groups.values()
      );

    result.forEach((group) => {
      group.stories.sort(
        (a, b) =>
          new Date(
            a.created_at
          ) -
          new Date(
            b.created_at
          )
      );

      const latestStory =
        group.stories[
          group.stories.length - 1
        ];

      group.author =
        latestStory.author;

      group.avatar_url =
        latestStory.avatar_url;

      group.is_owner =
        group.stories.some(
          (story) =>
            Boolean(
              story.is_owner
            )
        );

      group.hasUnread =
        group.stories.some(
          (story) =>
            !story.is_viewed
        );
    });

    result.sort((a, b) => {
      if (
        a.is_owner &&
        !b.is_owner
      ) {
        return -1;
      }

      if (
        !a.is_owner &&
        b.is_owner
      ) {
        return 1;
      }

      const aLatest =
        a.stories[
          a.stories.length - 1
        ];

      const bLatest =
        b.stories[
          b.stories.length - 1
        ];

      return (
        new Date(
          bLatest.created_at
        ) -
        new Date(
          aLatest.created_at
        )
      );
    });

    return result;
  }, [stories]);

  const ownerGroup =
    storyGroups.find(
      (group) =>
        group.is_owner
    ) || null;

  const ownerGroupIndex =
    storyGroups.findIndex(
      (group) =>
        group.is_owner
    );

  const otherStoryGroups =
    storyGroups.filter(
      (group) =>
        !group.is_owner
    );

  const activeGroup =
    activeUserIndex === null
      ? null
      : storyGroups[
          activeUserIndex
        ];

  const activeStory =
    activeGroup &&
    activeStoryIndex !== null
      ? activeGroup.stories[
          activeStoryIndex
        ]
      : null;

  /*
   * ==========================================================
   * LOAD
   * ==========================================================
   */

  async function loadStories() {
    try {
      setLoading(true);

      const data =
        await getStories();

      setStories(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Could not load stories:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  /*
   * ==========================================================
   * EDITOR RESET
   * ==========================================================
   */

  function resetCreateForm() {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setContent("");
    setImage(null);
    setImagePreview("");

    setEditorBackground(0);
    setTextStyle("classic");
    setTextSize(32);

    setTextOffset({
      x: 0,
      y: 0,
    });

    /*
     * Reset Framer's internal
     * drag transform too.
     */
    setTextDragVersion(
      (value) => value + 1
    );

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  function openCreateModal() {
    resetCreateForm();
    setShowCreate(true);
  }

  function closeCreateModal() {
    if (submitting) {
      return;
    }

    resetCreateForm();
    setShowCreate(false);
  }

  /*
   * ==========================================================
   * CENTER TEXT
   * ==========================================================
   */

  function centerText() {
    /*
     * Exact coordinates.
     */
    setTextOffset({
      x: 0,
      y: 0,
    });

    /*
     * CRITICAL:
     *
     * Reset Framer Motion's internal
     * drag transform.
     *
     * Without this, the old drag
     * offset can visually remain.
     */
    setTextDragVersion(
      (value) => value + 1
    );
  }

  function cycleBackground() {
    setEditorBackground(
      (previous) =>
        (previous + 1) %
        STORY_BACKGROUNDS.length
    );
  }

  /*
   * ==========================================================
   * IMAGE
   * ==========================================================
   */

  function handleImageSelect(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );

    centerText();
  }

  function clearImage() {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(null);
    setImagePreview("");

    centerText();

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  /*
   * ==========================================================
   * POSITION UPDATE
   * ==========================================================
   */

  function handleTextPositionChange(
    updater
  ) {
    setTextOffset(updater);

    /*
     * Important:
     *
     * The old Framer drag layer has
     * already moved visually.
     *
     * We want to immediately replace
     * it with a fresh layer whose
     * transform is back to zero.
     *
     * React batches these updates,
     * producing the final correct state.
     */
    setTextDragVersion(
      (value) => value + 1
    );
  }

  /*
   * ==========================================================
   * CREATE STORY
   * ==========================================================
   */

  async function handleCreateStory() {
    if (
      submitting ||
      (!content.trim() && !image)
    ) {
      return;
    }

    try {
      setSubmitting(true);

      let mediaUrl = "";

      if (image) {
        const upload =
          await uploadStoryImage(
            image
          );

        mediaUrl =
          upload?.url || "";
      }

      const story =
        await createStory(
          mediaUrl,
          content.trim(),
          {
            textStyle,
            textSize,
            textX:
              textOffset.x,
            textY:
              textOffset.y,
            backgroundIndex:
              editorBackground,
          }
        );

      /*
       * Use the exact backend styling
       * returned by CreateStory.
       */
      setStories((previous) => [
        ...previous,
        {
          ...story,
          is_viewed: false,
          is_owner: true,
        },
      ]);

      closeCreateModal();
    } catch (error) {
      console.error(
        "[STORY CREATE] Failed:",
        error
      );

      console.error(
        "[STORY CREATE] Response:",
        error?.response
      );

      console.error(
        "[STORY CREATE] Response data:",
        error?.response?.data
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ==========================================================
   * VIEWING
   * ==========================================================
   */

  async function markStoryViewed(
    story
  ) {
    if (
      !story ||
      story.is_viewed
    ) {
      return;
    }

    setStories((previous) =>
      previous.map((item) =>
        item.id === story.id
          ? {
              ...item,
              is_viewed: true,
            }
          : item
      )
    );

    try {
      await viewStory(
        story.id
      );
    } catch (error) {
      console.error(
        "Could not record story view:",
        error
      );
    }
  }

  async function openUserStories(
    userIndex
  ) {
    const group =
      storyGroups[userIndex];

    if (
      !group ||
      !group.stories.length
    ) {
      return;
    }

    const firstUnread =
      group.stories.findIndex(
        (story) =>
          !story.is_viewed
      );

    const startIndex =
      firstUnread === -1
        ? 0
        : firstUnread;

    setActiveUserIndex(
      userIndex
    );

    setActiveStoryIndex(
      startIndex
    );

    setSwipeDirection(1);

    progressRef.current = 0;
    setProgressMs(0);
    setIsPaused(false);

    await markStoryViewed(
      group.stories[
        startIndex
      ]
    );
  }

  function closeStory() {
    setShowStoryViewers(false);
    setActiveUserIndex(null);
    setActiveStoryIndex(null);
    setProgressMs(0);
    progressRef.current = 0;
    setIsPaused(false);
  }

  async function goToNextStory() {
    if (
      activeUserIndex === null ||
      activeStoryIndex === null
    ) {
      return;
    }

    const group =
      storyGroups[
        activeUserIndex
      ];

    if (!group) {
      closeStory();
      return;
    }

    if (
      activeStoryIndex <
      group.stories.length - 1
    ) {
      const nextIndex =
        activeStoryIndex + 1;

      setSwipeDirection(1);
      setActiveStoryIndex(
        nextIndex
      );

      progressRef.current = 0;
      setProgressMs(0);
      setIsPaused(false);

      await markStoryViewed(
        group.stories[
          nextIndex
        ]
      );

      return;
    }

    if (
      activeUserIndex <
      storyGroups.length - 1
    ) {
      const nextUserIndex =
        activeUserIndex + 1;

      const nextGroup =
        storyGroups[
          nextUserIndex
        ];

      const firstUnread =
        nextGroup.stories.findIndex(
          (story) =>
            !story.is_viewed
        );

      const nextIndex =
        firstUnread === -1
          ? 0
          : firstUnread;

      setSwipeDirection(1);

      setActiveUserIndex(
        nextUserIndex
      );

      setActiveStoryIndex(
        nextIndex
      );

      progressRef.current = 0;
      setProgressMs(0);
      setIsPaused(false);

      await markStoryViewed(
        nextGroup.stories[
          nextIndex
        ]
      );

      return;
    }

    closeStory();
  }

  async function goToPreviousStory() {
    if (
      activeUserIndex === null ||
      activeStoryIndex === null
    ) {
      return;
    }

    if (
      activeStoryIndex > 0
    ) {
      const previousIndex =
        activeStoryIndex - 1;

      setSwipeDirection(-1);
      setActiveStoryIndex(
        previousIndex
      );

      progressRef.current = 0;
      setProgressMs(0);
      setIsPaused(false);

      await markStoryViewed(
        activeGroup.stories[
          previousIndex
        ]
      );

      return;
    }

    if (
      activeUserIndex > 0
    ) {
      const previousUserIndex =
        activeUserIndex - 1;

      const previousGroup =
        storyGroups[
          previousUserIndex
        ];

      const previousIndex =
        previousGroup.stories.length -
        1;

      setSwipeDirection(-1);

      setActiveUserIndex(
        previousUserIndex
      );

      setActiveStoryIndex(
        previousIndex
      );

      progressRef.current = 0;
      setProgressMs(0);
      setIsPaused(false);

      await markStoryViewed(
        previousGroup.stories[
          previousIndex
        ]
      );
    }
  }

  /*
   * ==========================================================
   * SWIPE
   * ==========================================================
   */

  function handleSwipeEnd(
    event,
    info
  ) {
    const swipePower =
      info.offset.x +
      info.velocity.x * 0.2;

    if (swipePower < -90) {
      goToNextStory();
      return;
    }

    if (swipePower > 90) {
      goToPreviousStory();
    }
  }

  /*
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  async function handleShowStoryViewers() {
    if (!activeStory?.is_owner) {
      return;
    }

    try {
      const users = await getStoryViewers(activeStory.id);
      setStoryViewers(users || []);
      setShowStoryViewers(true);
      setIsPaused(true);
    } catch (error) {
      console.error("Could not load story viewers:", error);
    }
  }

  async function handleDeleteStory() {
    if (
      !activeStory?.is_owner
    ) {
      return;
    }

    try {
      await deleteStory(
        activeStory.id
      );

      setStories((previous) =>
        previous.filter(
          (item) =>
            item.id !==
            activeStory.id
        )
      );

      closeStory();
    } catch (error) {
      console.error(
        "Could not delete story:",
        error
      );
    }
  }

  /*
   * ==========================================================
   * AUTO PROGRESS
   * ==========================================================
   */

  useEffect(() => {
    if (
      activeUserIndex === null ||
      activeStoryIndex === null ||
      isPaused
    ) {
      return;
    }

    let frame;

    const startedAt =
      performance.now() -
      progressRef.current;

    function tick(now) {
      const elapsed =
        now - startedAt;

      progressRef.current =
        Math.min(
          elapsed,
          STORY_DURATION
        );

      setProgressMs(
        progressRef.current
      );

      if (
        progressRef.current >=
        STORY_DURATION
      ) {
        goToNextStory();
        return;
      }

      frame =
        requestAnimationFrame(
          tick
        );
    }

    frame =
      requestAnimationFrame(
        tick
      );

    return () =>
      cancelAnimationFrame(frame);
  }, [
    activeUserIndex,
    activeStoryIndex,
    isPaused,
    storyGroups,
  ]);

  /*
   * ==========================================================
   * SPACEBAR
   * ==========================================================
   */

  useEffect(() => {
    if (
      activeUserIndex === null
    ) {
      return;
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.code !== "Space"
      ) {
        return;
      }

      event.preventDefault();

      if (!event.repeat) {
        setIsPaused(true);
      }
    }

    function handleKeyUp(event) {
      if (
        event.code !== "Space"
      ) {
        return;
      }

      event.preventDefault();
      setIsPaused(false);
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, [activeUserIndex]);

  /*
   * ==========================================================
   * PREVIEW CLEANUP
   * ==========================================================
   */

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <div
        className="
          mb-6
          overflow-hidden
          rounded-3xl
          border
          border-slate-200/80
          bg-white
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div
          className="
            flex
            gap-4
            px-4
            py-4
          "
        >
          {[
            1,
            2,
            3,
            4,
            5,
          ].map((item) => (
            <div
              key={item}
              className="
                h-16
                w-16
                shrink-0
                animate-pulse
                rounded-full
                bg-slate-200
                dark:bg-slate-800
              "
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===================================================== */}
      {/* STORY BAR                                             */}
      {/* ===================================================== */}

      <div
        className="
          mb-6
          overflow-hidden
          rounded-3xl
          border
          border-slate-200/80
          bg-white
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div
          className="
            flex
            items-center
            gap-4
            overflow-x-auto
            px-4
            py-4
            scrollbar-none
          "
        >
          {/* ADD */}

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="
              flex
              w-[68px]
              shrink-0
              flex-col
              items-center
              gap-2
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                border-2
                border-dashed
                border-indigo-400
                bg-indigo-50
                text-indigo-600
                transition
                hover:bg-indigo-100
                dark:bg-indigo-500/10
                dark:text-indigo-400
              "
            >
              <Plus size={24} />
            </div>

            <span
              className="
                w-full
                truncate
                text-center
                text-[11px]
                font-semibold
                text-slate-600
                dark:text-slate-300
              "
            >
              Add story
            </span>
          </button>

          {/* YOUR STORY */}

          {ownerGroup && (
            <button
              type="button"
              onClick={() =>
                openUserStories(
                  ownerGroupIndex
                )
              }
              className="
                flex
                w-[68px]
                shrink-0
                flex-col
                items-center
                gap-2
              "
            >
              <div
                className={`
                  rounded-full
                  p-[2px]
                  ${
                    ownerGroup.hasUnread
                      ? "bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  }
                `}
              >
                <div
                  className="
                    rounded-full
                    bg-white
                    p-[2px]
                    dark:bg-slate-900
                  "
                >
                  <Avatar
                    user={{
                      id:
                        ownerGroup.user_id,
                      name:
                        ownerGroup.author,
                      avatar_url:
                        ownerGroup.avatar_url,
                    }}
                    size="md"
                  />
                </div>
              </div>

              <span
                className="
                  w-full
                  truncate
                  text-center
                  text-[11px]
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                Your story
              </span>
            </button>
          )}

          {/* SEPARATOR */}

          <div
            className="
              h-11
              w-px
              shrink-0
              bg-gradient-to-b
              from-transparent
              via-slate-300
              to-transparent
              dark:via-slate-700
            "
          />

          {/* OTHER USERS */}

          {otherStoryGroups.map(
            (group) => {
              const groupIndex =
                storyGroups.findIndex(
                  (item) =>
                    item.user_id ===
                    group.user_id
                );

              return (
                <button
                  key={
                    group.user_id
                  }
                  type="button"
                  onClick={() =>
                    openUserStories(
                      groupIndex
                    )
                  }
                  className="
                    flex
                    w-[68px]
                    shrink-0
                    flex-col
                    items-center
                    gap-2
                  "
                >
                  <div
                    className={`
                      rounded-full
                      p-[2px]
                      ${
                        group.hasUnread
                          ? "bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500"
                          : "bg-slate-300 dark:bg-slate-700"
                      }
                    `}
                  >
                    <div
                      className="
                        rounded-full
                        bg-white
                        p-[2px]
                        dark:bg-slate-900
                      "
                    >
                      <Avatar
                        user={{
                          id:
                            group.user_id,
                          name:
                            group.author,
                          avatar_url:
                            group.avatar_url,
                        }}
                        size="md"
                      />
                    </div>
                  </div>

                  <span
                    className="
                      w-full
                      truncate
                      text-center
                      text-[11px]
                      font-medium
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {group.author}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* CREATE EDITOR                                         */}
      {/* ===================================================== */}

      <AnimatePresence>
        {showCreate && (
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
            className="
              fixed
              inset-0
              z-[100]
              overflow-y-auto
              bg-slate-950
              p-4
            "
          >
            <div
              className="
                mx-auto
                flex
                min-h-full
                w-full
                max-w-6xl
                flex-col
              "
            >
              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  pb-4
                "
              >
                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-white/10
                    text-white
                  "
                >
                  <X size={20} />
                </button>

                <span
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Create Story
                </span>

                <button
                  type="button"
                  onClick={
                    handleCreateStory
                  }
                  disabled={
                    submitting ||
                    (
                      !content.trim() &&
                      !image
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white
                    px-4
                    py-2
                    text-sm
                    font-bold
                    text-slate-950
                    disabled:opacity-40
                  "
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      Posting
                    </>
                  ) : (
                    <>
                      Post
                      <Send size={15} />
                    </>
                  )}
                </button>
              </div>

              {/* BODY */}

              <div
                className="
                  grid
                  flex-1
                  gap-5
                  lg:grid-cols-[minmax(0,1fr)_340px]
                "
              >
                {/* ================================================= */}
                {/* EDITOR CANVAS                                    */}
                {/* ================================================= */}

                <div
                  className="
                    flex
                    min-h-[560px]
                    items-center
                    justify-center
                  "
                >
                  <div
                    ref={
                      editorCanvasRef
                    }
                    className="
                      relative
                      h-[min(78vh,760px)]
                      aspect-[9/16]
                      w-auto
                      max-w-full
                      overflow-hidden
                      rounded-[28px]
                      bg-slate-900
                      shadow-2xl
                    "
                  >
                    {imagePreview ? (
                      <>
                        {/* BLURRED BACKGROUND */}

                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={
                              imagePreview
                            }
                            alt=""
                            draggable="false"
                            className="
                              absolute
                              inset-0
                              h-full
                              w-full
                              scale-110
                              object-cover
                              opacity-70
                              blur-3xl
                            "
                          />

                          <div
                            className="
                              absolute
                              inset-0
                              bg-black/20
                            "
                          />
                        </div>

                        {/* FULL ORIGINAL IMAGE */}

                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <img
                            src={
                              imagePreview
                            }
                            alt=""
                            draggable="false"
                            className="
                              h-full
                              w-full
                              object-contain
                            "
                          />
                        </div>

                        <div
                          className="
                            pointer-events-none
                            absolute
                            inset-0
                            bg-gradient-to-b
                            from-black/15
                            via-transparent
                            to-black/40
                          "
                        />
                      </>
                    ) : (
                      <div
                        className={`
                          absolute
                          inset-0
                          ${
                            STORY_BACKGROUNDS[
                              editorBackground
                            ]
                              .className
                          }
                        `}
                      />
                    )}

                    {/* EDITOR TEXT */}

                    {content.trim() && (
                      <StoryText
                        key={
                          `editor-text-${textDragVersion}`
                        }
                        content={
                          content
                        }
                        textStyle={
                          textStyle
                        }
                        textSize={
                          textSize
                        }
                        textX={
                          textOffset.x
                        }
                        textY={
                          textOffset.y
                        }
                        draggable
                        canvasRef={
                          editorCanvasRef
                        }
                        onPositionChange={
                          handleTextPositionChange
                        }
                        dragVersion={
                          textDragVersion
                        }
                      />
                    )}

                    {!content.trim() &&
                      !imagePreview && (
                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            text-center
                            text-white/60
                          "
                        >
                          <div>
                            <Type
                              className="
                                mx-auto
                                mb-3
                              "
                              size={32}
                            />

                            <p className="text-sm">
                              Write something
                              to start
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* ================================================= */}
                {/* CONTROLS                                         */}
                {/* ================================================= */}

                <div
                  className="
                    flex
                    flex-col
                    rounded-3xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    p-4
                  "
                >
                  {/* TEXT */}

                  <div className="mb-4">
                    <div
                      className="
                        mb-2
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <Type
                        size={16}
                        className="text-white/50"
                      />

                      <span
                        className="
                          text-sm
                          font-semibold
                          text-white
                        "
                      >
                        Text
                      </span>
                    </div>

                    <textarea
                      value={content}
                      onChange={(event) =>
                        setContent(
                          event.target.value
                        )
                      }
                      placeholder="Write your story..."
                      rows={5}
                      className="
                        w-full
                        resize-none
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        p-4
                        text-sm
                        leading-6
                        text-white
                        outline-none
                        placeholder:text-white/30
                      "
                    />
                  </div>

                  {/* SIZE */}

                  <div className="mb-5">
                    <p
                      className="
                        mb-2
                        text-xs
                        font-semibold
                        text-white/60
                      "
                    >
                      Text size
                    </p>

                    <div
                      className="
                        grid
                        grid-cols-4
                        gap-2
                      "
                    >
                      {[24, 32, 40, 50].map(
                        (size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              setTextSize(
                                size
                              )
                            }
                            className={`
                              rounded-xl
                              px-2
                              py-2.5
                              text-xs
                              font-bold
                              ${
                                textSize ===
                                size
                                  ? "bg-white text-slate-950"
                                  : "bg-white/10 text-white/70"
                              }
                            `}
                          >
                            {size}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* STYLE */}

                  <div className="mb-5">
                    <p
                      className="
                        mb-2
                        text-xs
                        font-semibold
                        text-white/60
                      "
                    >
                      Text style
                    </p>

                    <div
                      className="
                        grid
                        grid-cols-3
                        gap-2
                      "
                    >
                      {Object.entries(
                        TEXT_STYLES
                      ).map(
                        ([key, style]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setTextStyle(
                                key
                              )
                            }
                            className={`
                              rounded-xl
                              px-2
                              py-3
                              text-xs
                              font-semibold
                              ${
                                textStyle ===
                                key
                                  ? "bg-white text-slate-950"
                                  : "bg-white/10 text-white/70"
                              }
                            `}
                          >
                            {
                              style.label
                            }
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* BACKGROUND */}

                  {!imagePreview && (
                    <div className="mb-5">
                      <div
                        className="
                          mb-2
                          flex
                          items-center
                          justify-between
                        "
                      >
                        <span
                          className="
                            text-xs
                            font-semibold
                            text-white/60
                          "
                        >
                          Background
                        </span>

                        <button
                          type="button"
                          onClick={
                            cycleBackground
                          }
                          className="
                            rounded-lg
                            bg-white/10
                            px-2
                            py-1
                            text-[11px]
                            text-white/70
                          "
                        >
                          Next
                        </button>
                      </div>

                      <div
                        className="
                          grid
                          grid-cols-5
                          gap-2
                        "
                      >
                        {STORY_BACKGROUNDS.map(
                          (
                            background,
                            index
                          ) => (
                            <button
                              key={
                                background.name
                              }
                              type="button"
                              onClick={() =>
                                setEditorBackground(
                                  index
                                )
                              }
                              className={`
                                h-10
                                rounded-xl
                                ${background.className}
                                ${
                                  editorBackground ===
                                  index
                                    ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950"
                                    : ""
                                }
                              `}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* PHOTO */}

                  <label
                    className="
                      mb-2
                      flex
                      cursor-pointer
                      items-center
                      gap-3
                      rounded-2xl
                      bg-white/10
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-white/15
                    "
                  >
                    <ImagePlus
                      size={18}
                    />

                    {image
                      ? "Change photo"
                      : "Add photo"}

                    <input
                      ref={
                        fileInputRef
                      }
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageSelect
                      }
                    />
                  </label>

                  {/* CENTER */}

                  {content.trim() && (
                    <button
                      type="button"
                      onClick={
                        centerText
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-2xl
                        bg-white/10
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-white/80
                        transition
                        hover:bg-white/15
                      "
                    >
                      <RotateCcw
                        size={16}
                      />

                      Center text
                    </button>
                  )}

                  {/* POSITION INFO */}

                  {content.trim() && (
                    <div
                      className="
                        mt-3
                        rounded-2xl
                        border
                        border-white/5
                        bg-black/20
                        px-3
                        py-2
                        text-center
                        text-[11px]
                        text-white/35
                      "
                    >
                      Drag text directly
                      on the story canvas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* STORY VIEWER                                          */}
      {/* ===================================================== */}

      <AnimatePresence
        initial={false}
      >
        {activeStory && (
          <motion.div
            key={
              activeStory.id
            }
            initial={{
              opacity: 0,
              x:
                swipeDirection > 0
                  ? 100
                  : -100,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x:
                swipeDirection > 0
                  ? -100
                  : 100,
            }}
            transition={{
              duration: 0.22,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="
              fixed
              inset-0
              z-[200]
              flex
              items-center
              justify-center
              bg-black
            "
          >
            {/* PROGRESS */}

            <div
              className="
                absolute
                left-4
                right-4
                top-4
                z-40
                flex
                gap-1.5
              "
            >
              {activeGroup?.stories.map(
                (
                  story,
                  index
                ) => {
                  let width = 0;

                  if (
                    index <
                    activeStoryIndex
                  ) {
                    width = 100;
                  } else if (
                    index ===
                    activeStoryIndex
                  ) {
                    width =
                      (
                        progressMs /
                        STORY_DURATION
                      ) *
                      100;
                  }

                  return (
                    <div
                      key={
                        story.id
                      }
                      className="
                        h-1
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/20
                      "
                    >
                      <div
                        className="
                          h-full
                          bg-white
                        "
                        style={{
                          width: `${Math.min(
                            100,
                            width
                          )}%`,
                        }}
                      />
                    </div>
                  );
                }
              )}
            </div>

            {/* HEADER */}

            <div
              className="
                absolute
                left-5
                right-5
                top-8
                z-40
                flex
                items-start
                justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <Avatar
                  user={{
                    id:
                      activeStory.user_id,
                    name:
                      activeStory.author,
                    avatar_url:
                      activeStory.avatar_url,
                  }}
                  size="md"
                />

                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    {
                      activeStory.author
                    }
                  </p>

                  <p
                    className="
                      text-xs
                      text-white/60
                    "
                  >
                    {formatStoryAge(
                      activeStory.created_at
                    )}
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                {activeStory.is_owner && (
                  <button
                    type="button"
                    onClick={handleShowStoryViewers}
                    className="
                      flex h-9 items-center gap-2 rounded-full
                      bg-white/10 px-3 text-white backdrop-blur-md
                      transition hover:bg-white/20
                    "
                  >
                    <span className="text-xs font-semibold">
                      {activeStory.view_count || 0}
                    </span>
                    <span className="text-xs font-medium">
                      views
                    </span>
                  </button>
                )}

                {activeStory.is_owner && (
                  <button
                    type="button"
                    onClick={
                      handleDeleteStory
                    }
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      bg-white/10
                      text-white
                      backdrop-blur-md
                      transition
                      hover:bg-red-500/25
                    "
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    closeStory
                  }
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-white/10
                    text-white
                    backdrop-blur-md
                  "
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* STORY / SWIPE */}

            <motion.div
              className="
                h-full
                w-full
                px-5
                py-20
              "
              drag="x"
              dragConstraints={{
                left: 0,
                right: 0,
              }}
              dragElastic={0.18}
              onDragStart={() =>
                setIsPaused(true)
              }
              onDragEnd={(
                event,
                info
              ) => {
                setIsPaused(false);

                handleSwipeEnd(
                  event,
                  info
                );
              }}
            >
              <div
                className="
                  mx-auto
                  h-full
                  max-h-[820px]
                  w-full
                  max-w-md
                  overflow-hidden
                  rounded-3xl
                "
              >
                <StoryVisual
                  story={
                    activeStory
                  }
                  className="h-full"
                />
              </div>
            </motion.div>

            {/* PREVIOUS */}

            <button
              type="button"
              disabled={
                activeUserIndex ===
                  0 &&
                activeStoryIndex ===
                  0
              }
              onClick={
                goToPreviousStory
              }
              className="
                absolute
                left-3
                top-1/2
                z-40
                flex
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                backdrop-blur-md
                disabled:opacity-20
              "
            >
              <ChevronLeft
                size={24}
              />
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={
                goToNextStory
              }
              className="
                absolute
                right-3
                top-1/2
                z-40
                flex
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                backdrop-blur-md
              "
            >
              <ChevronRight
                size={24}
              />
            </button>

            {/* PAUSED */}

            {isPaused && (
              <div
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  z-40
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-black/50
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  backdrop-blur-md
                "
              >
                Paused
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showStoryViewers && (
        <UserListModal
          title="Story viewers"
          users={storyViewers}
          onClose={() => {
            setShowStoryViewers(false);
            setIsPaused(false);
          }}
        />
      )}
    </>
  );
}

export default StoryBar;