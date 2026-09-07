import {
  Search as SearchIcon,
  UserRound,
  GraduationCap,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
  Link,
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  searchUsers,
} from "../services/postService";

import Avatar from "../components/Avatar";

function Search() {
  const [searchParams] =
    useSearchParams();

  const query =
    searchParams.get("q");

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadResults() {
      if (!query) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data =
          await searchUsers(query);

        setUsers(data || []);
      } catch (error) {
        console.error(error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [query]);

  return (
    <MainLayout>
      <div className="
        mx-auto
        w-full
        max-w-4xl
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
          transition={{
            duration: 0.3,
          }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-500/10
              dark:text-indigo-400
            ">
              <SearchIcon size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Search
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Find people in your campus community.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search summary */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
            duration: 0.3,
          }}
          className="
            mb-4
            rounded-2xl
            border
            border-slate-200/80
            bg-white
            px-4 py-3
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
          ">
            Results for{" "}
            <span className="
              font-semibold
              text-slate-900
              dark:text-white
            ">
              "{query || ""}"
            </span>
          </p>
        </motion.div>

        {/* Loading */}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="
                  h-20
                  animate-pulse
                  rounded-2xl
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

        {/* Results */}

        {!loading &&
          users.length > 0 && (
            <div className="space-y-3">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.25,
                    delay:
                      Math.min(
                        index * 0.04,
                        0.2
                      ),
                  }}
                >
                  <Link
                    to={`/profile/${user.id}`}
                    className="
                      group
                      flex items-center
                      gap-4
                      rounded-2xl
                      border
                      border-slate-200/80
                      bg-white
                      p-4
                      shadow-sm
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:border-indigo-200
                      hover:shadow-md
                      dark:border-slate-800
                      dark:bg-slate-900
                      dark:hover:border-indigo-500/30
                    "
                  >
                    <div className="shrink-0">
                      <Avatar
                        user={user}
                        size="md"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="
                        truncate
                        text-sm
                        font-semibold
                        text-slate-950
                        dark:text-white
                      ">
                        {user.name}
                      </h2>

                      <div className="
                        mt-1
                        flex flex-wrap
                        items-center
                        gap-1.5
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      ">
                        <GraduationCap
                          size={14}
                        />

                        <span>
                          {user.faculty ||
                            "CampusHub User"}
                        </span>
                      </div>
                    </div>

                    <div className="
                      flex h-9 w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-slate-400
                      transition
                      group-hover:bg-indigo-50
                      group-hover:text-indigo-600
                      dark:bg-slate-800
                      dark:group-hover:bg-indigo-500/10
                      dark:group-hover:text-indigo-400
                    ">
                      <UserRound
                        size={17}
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

        {/* Empty */}

        {!loading &&
          users.length === 0 && (
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
                bg-slate-100
                text-slate-400
                dark:bg-slate-800
              ">
                <SearchIcon size={24} />
              </div>

              <h2 className="
                mt-4
                text-lg
                font-semibold
              ">
                No users found
              </h2>

              <p className="
                mx-auto
                mt-2
                max-w-sm
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                We couldn't find anyone matching
                "{query || ""}".
              </p>
            </motion.div>
          )}
      </div>
    </MainLayout>
  );
}

export default Search;