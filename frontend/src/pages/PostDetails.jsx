import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/PostCard";

import {
  getPost,
} from "../services/postService";

import {
  useWebSocket,
} from "../contexts/WebSocketContext";

function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const {
    postLikes,
    commentCounts,
  } = useWebSocket();

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);

        const data =
          await getPost(id);

        setPost(data);
      } catch (error) {
        console.error(error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  useEffect(() => {
    if (!postLikes.length) {
      return;
    }

    const latest =
      postLikes[0];

    if (
      Number(id) !==
      latest.post_id
    ) {
      return;
    }

    setPost((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        likes:
          prev.likes +
          latest.delta,
      };
    });
  }, [postLikes, id]);

  useEffect(() => {
    if (!commentCounts.length) {
      return;
    }

    const latest =
      commentCounts[0];

    if (
      Number(id) !==
      latest.post_id
    ) {
      return;
    }

    setPost((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        comments:
          prev.comments +
          latest.delta,
      };
    });
  }, [
    commentCounts,
    id,
  ]);

  return (
    <MainLayout>
      <div className="
        mx-auto
        w-full
        max-w-3xl
      ">

        {/* Header */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-5"
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="
              mb-4
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-2 py-2
              text-sm
              font-medium
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
              dark:hover:bg-slate-900
              dark:hover:text-white
            "
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="
            flex
            items-center
            gap-3
          ">
            <div className="
              flex h-11 w-11
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-500/10
              dark:text-indigo-400
            ">
              <FileText size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Post
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                View this post and its
                conversation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading */}

        {loading && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <div className="animate-pulse">
              <div className="
                flex items-center
                gap-3
              ">
                <div className="
                  h-11 w-11
                  rounded-full
                  bg-slate-200
                  dark:bg-slate-800
                " />

                <div className="space-y-2">
                  <div className="
                    h-3 w-28
                    rounded
                    bg-slate-200
                    dark:bg-slate-800
                  " />

                  <div className="
                    h-3 w-20
                    rounded
                    bg-slate-200
                    dark:bg-slate-800
                  " />
                </div>
              </div>

              <div className="
                mt-5
                h-4
                w-3/4
                rounded
                bg-slate-200
                dark:bg-slate-800
              " />

              <div className="
                mt-2
                h-4
                w-1/2
                rounded
                bg-slate-200
                dark:bg-slate-800
              " />

              <div className="
                mt-5
                h-64
                rounded-2xl
                bg-slate-200
                dark:bg-slate-800
              " />
            </div>
          </motion.div>
        )}

        {/* Not found */}

        {!loading && !post && (
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
              border
              border-dashed
              border-slate-300
              bg-white
              px-6 py-16
              text-center
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <div className="
              mx-auto
              flex h-14 w-14
              items-center
              justify-center
              rounded-2xl
              bg-red-50
              text-red-500
              dark:bg-red-500/10
              dark:text-red-400
            ">
              <AlertCircle size={24} />
            </div>

            <h2 className="
              mt-4
              text-lg
              font-semibold
            ">
              Post not found
            </h2>

            <p className="
              mx-auto
              mt-2
              max-w-sm
              text-sm
              text-slate-500
              dark:text-slate-400
            ">
              This post may have been
              deleted or is no longer
              available.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/feed")
              }
              className="
                mt-5
                rounded-xl
                bg-indigo-600
                px-4 py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-indigo-700
              "
            >
              Back to Feed
            </button>
          </motion.div>
        )}

        {/* Post */}

        {!loading && post && (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <PostCard
              post={post}
            />
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}

export default PostDetails;