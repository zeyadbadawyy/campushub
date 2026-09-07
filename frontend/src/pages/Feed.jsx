import { useEffect, useState } from "react";
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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    postLikes,
    newPosts,
    commentCounts,
  } = useWebSocket();

  async function loadPosts() {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

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

    const newest = newPosts[0];

    setPosts((prev) => {
      const exists = prev.some(
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
            onPostCreated={loadPosts}
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
                  onLike={loadPosts}
                />
              </motion.div>
            ))}
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