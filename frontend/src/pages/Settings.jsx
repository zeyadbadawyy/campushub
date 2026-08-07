import MainLayout from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";
import {
  useTheme
} from "../contexts/ThemeContext";
import { useEffect, useState } from "react";
import {
  getUserActivity,
  getSettings,
  updateSettings,
  deleteAccount
} from "../services/postService";

function Settings() {

  const navigate =
    useNavigate();
  
  const [
    activity,
    setActivity
  ] = useState(null);

  const {
    darkMode,
    toggleDarkMode
  } = useTheme();

  const [settings, setSettings] = useState({
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,
    message_notifications: true,

    private_account: false,
    show_online_status: true,
    allow_messages: true,
    show_in_search: true,

    dark_mode: false
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

        setSettings(
          data
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    loadSettings();

  }, []);

  async function handleToggle(
    key
  ) {

    const updated = {

      ...settings,

      [key]:
        !settings[key]

    };

    setSettings(
      updated
    );

    try {

      await updateSettings(
        updated
      );

    } catch (error) {

      console.error(
        error
      );

    }

  }

  async function handleDeleteAccount() {

    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete your account?"
      );

    if (!confirmed)
      return;

    try {

      await deleteAccount();

      localStorage.removeItem(
        "token"
      );

      navigate(
        "/login"
      );

    } catch (error) {

      console.error(
        error
      );

    }

  }

  return (

    <MainLayout>

      <div className="settings-page">

        <div className="settings-card">

          <h1>

            Settings

          </h1>

          <p>

            Manage your account preferences.

          </p>

          <div className="settings-section">

            <h2>👤 Profile</h2>

            <button onClick={() => navigate("/edit-profile")}>

              Edit Profile

            </button>

          </div>

          <div className="settings-section">

            <h2>🔒 Security</h2>

            <button onClick={() => navigate("/change-password")}>

              Change Password

            </button>

          </div>

          <div className="settings-section">

            <div className="setting-row">

              <span>

                Dark Mode

              </span>

              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleDarkMode}
              />

            </div>

          </div>

          <div className="settings-section">

            <h2>🔔 Notifications</h2>

            <div className="setting-row">

              <span>Like Notifications</span>

              <input
                type="checkbox"
                checked={
                  settings?.like_notifications
                }
                onChange={() =>
                  handleToggle(
                    "like_notifications"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Comment Notifications</span>

              <input
                type="checkbox"
                checked={settings.comment_notifications}
                onChange={() =>
                  handleToggle(
                    "comment_notifications"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Follow Notifications</span>

              <input
                type="checkbox"
                checked={settings.follow_notifications}
                onChange={() =>
                  handleToggle(
                    "follow_notifications"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Message Notifications</span>

              <input
                type="checkbox"
                checked={settings.message_notifications}
                onChange={() =>
                  handleToggle(
                    "message_notifications"
                  )
                }
              />

            </div>

          </div>

          <div className="settings-section">

            <h2>🔐 Privacy</h2>

            <div className="setting-row">

              <span>Private Account</span>

              <input
                type="checkbox"
                checked={settings.private_account}
                onChange={() =>
                  handleToggle(
                    "private_account"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Show Online Status</span>

              <input
                type="checkbox"
                checked={settings.show_online_status}
                onChange={() =>
                  handleToggle(
                    "show_online_status"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Allow Messages From Everyone</span>

              <input
                type="checkbox"
                checked={settings.allow_messages}
                onChange={() =>
                  handleToggle(
                    "allow_messages"
                  )
                }
              />

            </div>

            <div className="setting-row">

              <span>Show Profile In Search</span>

              <input
                type="checkbox"
                checked={settings.show_in_search}
                onChange={() =>
                  handleToggle(
                    "show_in_search"
                  )
                }
              />

            </div>

          </div>

          <div className="settings-section">

            <h2>📊 Activity</h2>

            {activity && (

              <div className="activity-grid">

                <div>

                  <strong>
                    {activity.posts}
                  </strong>

                  <span>
                    Posts
                  </span>

                </div>

                <div>

                  <strong>
                    {activity.comments}
                  </strong>

                  <span>
                    Comments
                  </span>

                </div>

                <div>

                  <strong>
                    {activity.likesReceived}
                  </strong>

                  <span>
                    Likes Received
                  </span>

                </div>

                <div>

                  <strong>
                    {activity.followers}
                  </strong>

                  <span>
                    Followers
                  </span>

                </div>

                <div>

                  <strong>
                    {activity.following}
                  </strong>

                  <span>
                    Following
                  </span>

                </div>

              </div>

            )}

          </div>

          <div className="settings-section danger-zone">

            <h2>🚨 Danger Zone</h2>

            <button
              className="delete-btn"
              onClick={
                handleDeleteAccount
              }
            >

              Delete Account

            </button>

          </div>

        </div>

      </div>

    </MainLayout>

  );

}

export default Settings;