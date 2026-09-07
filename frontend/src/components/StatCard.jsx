import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  loading = false,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -3,
      }}
      className="
        group
        rounded-3xl
        border
        border-slate-200/80
        bg-white
        p-5
        shadow-sm
        transition-shadow
        duration-200
        hover:shadow-md
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div className="
        flex
        items-start
        justify-between
      ">
        <div className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          bg-indigo-50
          text-indigo-600
          dark:bg-indigo-500/10
          dark:text-indigo-400
        ">
          {Icon && (
            <Icon size={20} />
          )}
        </div>

        <ArrowUpRight
          size={17}
          className="
            text-slate-300
            transition-colors
            duration-200
            group-hover:text-indigo-500
            dark:text-slate-700
            dark:group-hover:text-indigo-400
          "
        />
      </div>

      <div className="mt-6">
        <p className="
          text-sm
          font-medium
          text-slate-500
          dark:text-slate-400
        ">
          {title}
        </p>

        {loading ? (
          <div className="
            mt-2
            h-9
            w-16
            animate-pulse
            rounded-lg
            bg-slate-200
            dark:bg-slate-800
          " />
        ) : (
          <p className="
            mt-1
            text-3xl
            font-bold
            tracking-tight
            text-slate-950
            dark:text-white
          ">
            {value}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default StatCard;