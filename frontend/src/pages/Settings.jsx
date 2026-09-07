import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  UserRound,
  Shield,
  Bell,
  Lock,
  Moon,
  Pencil,
  KeyRound,
  Trash2,
  Activity,
  AlertTriangle,
  ChevronRight,
  Heart,
  MessageCircle,
  UserPlus,
  Mail,
  Search,
  Eye,
  MessageSquare,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTheme,
} from "../contexts/ThemeContext";

import {
  getUserActivity,
  getSettings,
  updateSettings,
  deleteAccount,
} from "../services/postService";

function Settings() {
  const navigate = useNavigate();

  const {
    darkMode,
    toggleDarkMode,
  } = useTheme();

  const [activity, setActivity] =
    useState(null);

  const [settings, setSettings] = useState({
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
    message_notifications: true,

    private_account: false,
    show_online_status: true,
    allow_messages: true,
    show_in_search: true,

    dark_mode: false,
  });

  useEffect(() => {
    async function loadActivity() {
      try {
        const data =
          await getUserActivity();

        setActivity(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadActivity();
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data =
          await getSettings();

        setSettings(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadSettings();
  }, []);

  async function handleToggle(key) {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(updated);

    try {
      await updateSettings(updated);
    } catch (error) {
      console.error(error);

      setSettings(settings);
    }
  }

  async function handleDeleteAccount() {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete your account?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAccount();

      localStorage.removeItem("token");

      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  }

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
          className="mb-6"
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
              <Shield size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Settings
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Manage your account,
                privacy, and preferences.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-5">

          {/* Account */}

          <SettingsSection
            icon={<UserRound size={18} />}
            title="Account"
            description="Manage your profile and security."
          >
            <SettingsButton
              icon={<Pencil size={17} />}
              title="Edit Profile"
              description="Update your name, faculty, bio, and photo."
              onClick={() =>
                navigate("/edit-profile")
              }
            />

            <SettingsButton
              icon={<KeyRound size={17} />}
              title="Change Password"
              description="Update your account password."
              onClick={() =>
                navigate("/change-password")
              }
            />
          </SettingsSection>

          {/* Appearance */}

          <SettingsSection
            icon={<Moon size={18} />}
            title="Appearance"
            description="Customize how CampusHub looks."
          >
            <SettingToggle
              icon={<Moon size={17} />}
              title="Dark Mode"
              description="Use the dark color scheme."
              checked={darkMode}
              onChange={toggleDarkMode}
            />
          </SettingsSection>

          {/* Notifications */}

          <SettingsSection
            icon={<Bell size={18} />}
            title="Notifications"
            description="Choose which activity can notify you."
          >
            <SettingToggle
              icon={<Heart size={17} />}
              title="Like Notifications"
              description="Get notified when someone likes your posts."
              checked={
                settings.like_notifications
              }
              onChange={() =>
                handleToggle(
                  "like_notifications"
                )
              }
            />

            <SettingToggle
              icon={<MessageCircle size={17} />}
              title="Comment Notifications"
              description="Get notified about comments on your posts."
              checked={
                settings.comment_notifications
              }
              onChange={() =>
                handleToggle(
                  "comment_notifications"
                )
              }
            />

            <SettingToggle
              icon={<UserPlus size={17} />}
              title="Follow Notifications"
              description="Get notified about follows and requests."
              checked={
                settings.follow_notifications
              }
              onChange={() =>
                handleToggle(
                  "follow_notifications"
                )
              }
            />

            <SettingToggle
              icon={<Mail size={17} />}
              title="Message Notifications"
              description="Get notified about new messages."
              checked={
                settings.message_notifications
              }
              onChange={() =>
                handleToggle(
                  "message_notifications"
                )
              }
            />
          </SettingsSection>

          {/* Privacy */}

          <SettingsSection
            icon={<Lock size={18} />}
            title="Privacy"
            description="Control how other students can interact with you."
          >
            <SettingToggle
              icon={<Lock size={17} />}
              title="Private Account"
              description="Only approved followers can view your content."
              checked={
                settings.private_account
              }
              onChange={() =>
                handleToggle(
                  "private_account"
                )
              }
            />

            <SettingToggle
              icon={<Eye size={17} />}
              title="Show Online Status"
              description="Let others see when you are online."
              checked={
                settings.show_online_status
              }
              onChange={() =>
                handleToggle(
                  "show_online_status"
                )
              }
            />

            <SettingToggle
              icon={<MessageSquare size={17} />}
              title="Allow Messages From Everyone"
              description="Allow other students to message you."
              checked={
                settings.allow_messages
              }
              onChange={() =>
                handleToggle(
                  "allow_messages"
                )
              }
            />

            <SettingToggle
              icon={<Search size={17} />}
              title="Show Profile In Search"
              description="Allow your profile to appear in search results."
              checked={
                settings.show_in_search
              }
              onChange={() =>
                handleToggle(
                  "show_in_search"
                )
              }
            />
          </SettingsSection>

          {/* Activity */}

          <SettingsSection
            icon={<Activity size={18} />}
            title="Activity"
            description="A quick look at your CampusHub activity."
          >
            {activity ? (
              <div className="
                grid
                grid-cols-2
                gap-3
                sm:grid-cols-5
              ">
                <ActivityStat
                  value={activity.posts}
                  label="Posts"
                />

                <ActivityStat
                  value={activity.comments}
                  label="Comments"
                />

                <ActivityStat
                  value={activity.likesReceived}
                  label="Likes Received"
                />

                <ActivityStat
                  value={activity.followers}
                  label="Followers"
                />

                <ActivityStat
                  value={activity.following}
                  label="Following"
                />
              </div>
            ) : (
              <div className="
                grid
                grid-cols-2
                gap-3
                sm:grid-cols-5
              ">
                {[1, 2, 3, 4, 5].map(
                  (item) => (
                    <div
                      key={item}
                      className="
                        h-24
                        animate-pulse
                        rounded-2xl
                        bg-slate-100
                        dark:bg-slate-800
                      "
                    />
                  )
                )}
              </div>
            )}
          </SettingsSection>

          {/* Danger Zone */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              overflow-hidden
              rounded-3xl
              border
              border-red-200
              bg-red-50/50
              dark:border-red-500/20
              dark:bg-red-500/5
            "
          >
            <div className="
              flex
              items-start
              gap-3
              border-b
              border-red-100
              px-5 py-5
              dark:border-red-500/10
              sm:px-6
            ">
              <div className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-red-100
                text-red-600
                dark:bg-red-500/10
                dark:text-red-400
              ">
                <AlertTriangle
                  size={18}
                />
              </div>

              <div>
                <h2 className="
                  text-sm
                  font-semibold
                  text-red-700
                  dark:text-red-400
                ">
                  Danger Zone
                </h2>

                <p className="
                  mt-1
                  text-xs
                  text-red-600/70
                  dark:text-red-400/70
                ">
                  These actions can permanently
                  affect your account.
                </p>
              </div>
            </div>

            <div className="
              flex
              flex-col
              gap-4
              px-5 py-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
            ">
              <div>
                <p className="
                  text-sm
                  font-semibold
                ">
                  Delete Account
                </p>

                <p className="
                  mt-1
                  max-w-xl
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                ">
                  Permanently remove your account
                  and associated data.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleDeleteAccount
                }
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-white
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-red-600
                  transition
                  hover:bg-red-50
                  dark:border-red-500/20
                  dark:bg-slate-900
                  dark:text-red-400
                  dark:hover:bg-red-500/10
                "
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </MainLayout>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
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
      <div className="
        flex
        items-start
        gap-3
        border-b
        border-slate-100
        px-5 py-5
        dark:border-slate-800
        sm:px-6
      ">
        <div className="
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-indigo-50
          text-indigo-600
          dark:bg-indigo-500/10
          dark:text-indigo-400
        ">
          {icon}
        </div>

        <div>
          <h2 className="
            text-sm
            font-semibold
          ">
            {title}
          </h2>

          <p className="
            mt-1
            text-xs
            text-slate-500
            dark:text-slate-400
          ">
            {description}
          </p>
        </div>
      </div>

      <div className="
        divide-y
        divide-slate-100
        dark:divide-slate-800
      ">
        {children}
      </div>
    </motion.section>
  );
}

function SettingsButton({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex
        w-full
        items-center
        gap-3
        px-5 py-4
        text-left
        transition
        hover:bg-slate-50
        dark:hover:bg-slate-800/60
        sm:px-6
      "
    >
      <div className="
        flex h-9 w-9
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-slate-100
        text-slate-500
        transition
        group-hover:bg-indigo-50
        group-hover:text-indigo-600
        dark:bg-slate-800
        dark:text-slate-400
        dark:group-hover:bg-indigo-500/10
        dark:group-hover:text-indigo-400
      ">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="
          text-sm
          font-semibold
        ">
          {title}
        </p>

        <p className="
          mt-1
          text-xs
          text-slate-500
          dark:text-slate-400
        ">
          {description}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="
          shrink-0
          text-slate-300
          transition
          group-hover:translate-x-0.5
          group-hover:text-indigo-500
          dark:text-slate-600
        "
      />
    </button>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="
      flex
      items-center
      gap-3
      px-5 py-4
      sm:px-6
    ">
      <div className="
        flex h-9 w-9
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-slate-100
        text-slate-500
        dark:bg-slate-800
        dark:text-slate-400
      ">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="
          text-sm
          font-semibold
        ">
          {title}
        </p>

        <p className="
          mt-1
          text-xs
          leading-5
          text-slate-500
          dark:text-slate-400
        ">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`
          relative
          h-6
          w-11
          shrink-0
          rounded-full
          transition-colors
          ${
            checked
              ? "bg-indigo-600"
              : "bg-slate-200 dark:bg-slate-700"
          }
        `}
      >
        <span
          className={`
            absolute
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            rounded-full
            bg-white
            shadow-sm
            transition-transform
            ${
              checked
                ? "translate-x-6"
                : "translate-x-1"
            }
          `}
        />
      </button>
    </div>
  );
}

function ActivityStat({
  value,
  label,
}) {
  return (
    <div className="
      rounded-2xl
      bg-slate-50
      px-3 py-4
      text-center
      dark:bg-slate-950/60
    ">
      <strong className="
        block
        text-xl
        font-bold
      ">
        {value ?? 0}
      </strong>

      <span className="
        mt-1
        block
        text-[11px]
        font-medium
        text-slate-500
        dark:text-slate-400
      ">
        {label}
      </span>
    </div>
  );
}

export default Settings;