import { useState } from "react";

import MainLayout
  from "../layouts/MainLayout";

import {
  changePassword
} from "../services/postService";

function ChangePassword() {
  
  const [
    currentPassword,
    setCurrentPassword
  ] = useState("");

  const [
    newPassword,
    setNewPassword
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState("");

  const [
    messageType,
    setMessageType
  ] = useState("");

  async function handleSubmit(
    e
  ) {

    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (
      newPassword !==
      confirmPassword
    ) {

      setMessage(
        "Passwords do not match."
      );

      setMessageType(
        "error"
      );

      return;

    }

    if (
      newPassword.length < 6
    ) {

      setMessage(
        "Password must be at least 6 characters."
      );

      setMessageType(
        "error"
      );

      return;

    }

    if (
      currentPassword ===
      newPassword
    ) {

      setMessage(
        "New password must be different from current password."
      );

      setMessageType(
        "warning"
      );

      return;

    }

    try {

      setLoading(true);

      await changePassword(
        currentPassword,
        newPassword
      );

      setMessage(
        "Password updated successfully."
      );

      setMessageType(
        "success"
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {

      console.error(error);

      setMessage(
        error?.response?.data ||
        "Failed to update password."
      );

      setMessageType(
        "error"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <MainLayout>

      <div className="settings-page">

        <div className="settings-card">

          <h1>

            Change Password

          </h1>

          <p>

            Keep your account secure by using a strong password.

          </p>

          <form
            className="change-password-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>

                Current Password

              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>

                New Password

              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>

                Confirm New Password

              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>

            {message && (

              <div
                className={`password-message ${messageType}`}
              >

                {message}

              </div>

            )}

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >

              {
                loading
                  ? "Updating..."
                  : "Update Password"
              }

            </button>

          </form>

        </div>

      </div>

    </MainLayout>

  );

}

export default ChangePassword;