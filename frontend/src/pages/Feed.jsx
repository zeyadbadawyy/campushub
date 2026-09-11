import {
  useEffect,
  useRef,
  useState,
} from "react";

import { motion } from "framer-motion";
import {
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";

import { getPosts } from "../services/postService";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

function Feed() {
  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const loadMoreRef =
    useRef(null);

  const {
    postLikes,
    newPosts,
    commentCounts,
  } = useWebSocket();

  async function loadFirstPage() {
    try {
      setLoading(true);

      const data =
        await getPosts(1, 10);

      setPosts(data || []);
      setPage(1);
      setHasMore(
        (data || []).length === 10
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadNextPage() {
    if (
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    try {
      setLoadingMore(true);

      const nextPage =
        page + 1;

      const data =
        await getPosts(
          nextPage,
          10
        );

      const nextPosts =
        data || [];

      setPosts((prev) => {
        const existingIds =
          new Set(
            prev.map(
              (post) => post.id
            )
          );

        const uniquePosts =
          nextPosts.filter(
            (post) =>
              !existingIds.has(
                post.id
              )
          );

        return [
          ...prev,
          ...uniquePosts,
        ];
      });

      setPage(nextPage);

      if (
        nextPosts.length < 10
      ) {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

  useEffect(() => {
    const target =
      loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const firstEntry =
            entries[0];

          if (
            firstEntry.isIntersecting
          ) {
            loadNextPage();
          }
        },
        {
          root: null,
          rootMargin: "500px",
          threshold: 0,
        }
      );

    observer.observe(target);

    return () =>
      observer.disconnect();
  }, [
    page,
    hasMore,
    loading,
    loadingMore,
  ]);

  useEffect(() => {
    if (!postLikes.length) {
      return;
    }

    const latest = postLikes[0];

    setPosts((prev) =>
      prev.map((post) =>
        post.id === latest.post_id
          ? {
              ...post,
              likes:
                post.likes +
                latest.delta,
            }
          : post
      )
    );
  }, [postLikes]);

  useEffect(() => {
    
    if (!newPosts.length) {
      return;
    }

    const newest =
      newPosts[0];

    setPosts((prev) => {
      const exists =
        prev.some(
          (post) =>
            post.id === newest.id
        );

      if (exists) {
        return prev;
      }

      return [
        newest,
        ...prev,
      ];
    });
  }, [newPosts]);

  useEffect(() => {
    if (!commentCounts.length) {
      return;
    }

    const latest = commentCounts[0];

    setPosts((prev) =>
      prev.map((post) =>
        post.id === latest.post_id
          ? {
              ...post,
              comments:
                post.comments +
                latest.delta,
            }
          : post
      )
    );
  }, [commentCounts]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl">

        {/* Page heading */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-2xl
                bg-indigo-50
                text-indigo-600
                dark:bg-indigo-500/10
                dark:text-indigo-400
              "
            >
              <Newspaper size={21} />
            </div>

            <div>
              <h1
                className="
                  text-2xl font-bold
                  tracking-tight
                "
              >
                Campus Feed
              </h1>

              <p className="
                mt-1 text-sm
                text-slate-500
                dark:text-slate-400
              ">
                See what's happening
                around campus.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Small context row */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.1,
            duration: 0.3,
          }}
          className="
            mb-4 flex items-center
            justify-between
            rounded-2xl
            border border-slate-200/70
            bg-white/70
            px-4 py-3
            dark:border-slate-800
            dark:bg-slate-900/60
          "
        >
          <div className="flex items-center gap-2">
            <Users
              size={16}
              className="
                text-slate-400
              "
            />

            <span className="
              text-xs font-medium
              text-slate-500
              dark:text-slate-400
            ">
              Your campus community
            </span>
          </div>

          <div className="
            flex items-center gap-1.5
            text-xs font-medium
            text-indigo-600
            dark:text-indigo-400
          ">
            <Sparkles size={14} />
            Live feed
          </div>
        </motion.div>

        {/* Create post */}

        <div className="mb-6">
          <CreatePost
            onPostCreated={loadFirstPage}
          />
        </div>

        {/* Loading */}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  h-56 animate-pulse
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              />
            ))}
          </div>
        )}

        {/* Posts */}

        {!loading && (
          <div className="space-y-5">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{
                  opacity: 0,
                  y: 14,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay:
                    Math.min(index * 0.04, 0.2),
                }}
              >
                <PostCard
                  post={post}
                  onLike={loadFirstPage}
                />
              </motion.div>
            ))}

            {loadingMore && (
              <div className="
                flex
                items-center
                justify-center
                py-6
              ">
                <div className="
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-slate-200
                  border-t-indigo-600
                  dark:border-slate-700
                  dark:border-t-indigo-400
                " />
              </div>
            )}

            {!loadingMore &&
              hasMore && (
                <div
                  ref={loadMoreRef}
                  className="h-10"
                  aria-hidden="true"
                />
              )}

            {!hasMore &&
              posts.length > 0 && (
                <div className="
                  py-8
                  text-center
                  text-xs
                  text-slate-400
                ">
                  You're all caught up.
                </div>
              )}

          </div>
        )}

        {/* Empty state */}

        {!loading &&
          posts.length === 0 && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                rounded-3xl
                border border-dashed
                border-slate-300
                bg-white
                px-6 py-16
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div
                className="
                  mx-auto flex h-14 w-14
                  items-center justify-center
                  rounded-2xl
                  bg-indigo-50
                  text-indigo-600
                  dark:bg-indigo-500/10
                  dark:text-indigo-400
                "
              >
                <Newspaper size={24} />
              </div>

              <h2 className="
                mt-4 text-lg font-semibold
              ">
                Nothing here yet
              </h2>

              <p className="
                mx-auto mt-2 max-w-sm
                text-sm text-slate-500
                dark:text-slate-400
              ">
                Be the first person to
                share something with
                your campus community.
              </p>
            </motion.div>
          )}
      </div>
    </MainLayout>
  );
}

export default Feed;