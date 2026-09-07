import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  UserRoundPlus,
  MessageCircle,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";

import {
  getCurrentUser,
  getUserPosts,
  getFollowStats,
  getConversations,
} from "../services/postService";

function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    messages: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const currentUser =
          await getCurrentUser();

        const [
          userPosts,
          followStats,
          conversations,
        ] = await Promise.all([
          getUserPosts(currentUser.id),
          getFollowStats(currentUser.id),
          getConversations(),
        ]);

        setStats({
          posts: userPosts?.length || 0,
          followers:
            followStats?.followers || 0,
          following:
            followStats?.following || 0,
          messages:
            conversations?.length || 0,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <MainLayout>
      <div className="
        mx-auto
        w-full
        max-w-6xl
      ">

        {/* Header */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-8"
        >
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
              <LayoutDashboard
                size={21}
              />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Dashboard
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Your CampusHub activity at a glance.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}

        <div className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        ">

          <StatCard
            title="Posts"
            value={stats.posts}
            icon={FileText}
            loading={loading}
          />

          <StatCard
            title="Followers"
            value={stats.followers}
            icon={Users}
            loading={loading}
          />

          <StatCard
            title="Following"
            value={stats.following}
            icon={UserRoundPlus}
            loading={loading}
          />

          <StatCard
            title="Conversations"
            value={stats.messages}
            icon={MessageCircle}
            loading={loading}
          />

        </div>

        {/* Activity hint */}

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
            delay: 0.12,
          }}
          className="
            mt-6
            rounded-3xl
            border
            border-slate-200/80
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">
            <div>
              <p className="
                text-sm
                font-semibold
              ">
                Your CampusHub overview
              </p>

              <p className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              ">
                These numbers are pulled directly
                from your account data.
              </p>
            </div>

            <ArrowUpRight
              size={18}
              className="
                shrink-0
                text-slate-300
                dark:text-slate-600
              "
            />
          </div>
        </motion.div>

      </div>
    </MainLayout>
  );
}

export default Dashboard;