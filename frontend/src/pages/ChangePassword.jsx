import { useState } from "react";

import {
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import {
  changePassword,
} from "../services/postService";

function ChangePassword() {
  const navigate =
    useNavigate();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  async function handleSubmit(e) {
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
      <div className="
        mx-auto
        w-full
        max-w-2xl
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
          className="mb-6"
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
              <KeyRound size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Change Password
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Keep your CampusHub account secure.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
          onSubmit={handleSubmit}
          className="
            rounded-3xl
            border
            border-slate-200/80
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            sm:p-6
          "
        >
          <div className="
            mb-6
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-4
            dark:border-slate-800
            dark:bg-slate-950/50
          ">
            <div className="
              flex items-start
              gap-3
            ">
              <Lock
                size={18}
                className="
                  mt-0.5
                  shrink-0
                  text-slate-400
                "
              />

              <div>
                <p className="
                  text-sm
                  font-semibold
                ">
                  Password requirements
                </p>

                <p className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                ">
                  Your new password must be
                  at least 6 characters and
                  different from your current
                  password.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">

            <PasswordField
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
            />

            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
            />

            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
            />
          </div>

          {/* Feedback */}

          {message && (
            <motion.div
              initial={{
                opacity: 0,
                y: 5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className={`
                mt-5
                flex
                items-start
                gap-3
                rounded-2xl
                border
                px-4 py-3
                text-sm
                ${
                  messageType === "success"
                    ? `
                      border-emerald-200
                      bg-emerald-50
                      text-emerald-700
                      dark:border-emerald-500/20
                      dark:bg-emerald-500/10
                      dark:text-emerald-400
                    `
                    : messageType === "warning"
                    ? `
                      border-amber-200
                      bg-amber-50
                      text-amber-700
                      dark:border-amber-500/20
                      dark:bg-amber-500/10
                      dark:text-amber-400
                    `
                    : `
                      border-red-200
                      bg-red-50
                      text-red-700
                      dark:border-red-500/20
                      dark:bg-red-500/10
                      dark:text-red-400
                    `
                }
              `}
            >
              {messageType ===
              "success" ? (
                <CheckCircle2
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />
              ) : messageType ===
                "warning" ? (
                <AlertTriangle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />
              ) : (
                <AlertCircle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />
              )}

              <p>{message}</p>
            </motion.div>
          )}

          {/* Actions */}

          <div className="
            mt-6
            flex
            flex-col-reverse
            gap-2
            sm:flex-row
            sm:justify-end
          ">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5 py-2.5
                text-sm
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-300
                dark:hover:bg-slate-800
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-5 py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <KeyRound size={16} />
              )}

              {loading
                ? "Updating..."
                : "Update Password"}
            </button>
          </div>
        </motion.form>
      </div>
    </MainLayout>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-medium
        "
      >
        {label}
      </label>

      <div className="
        flex
        h-12
        items-center
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        px-3
        transition
        focus-within:border-indigo-500
        focus-within:bg-white
        focus-within:ring-4
        focus-within:ring-indigo-500/10
        dark:border-slate-700
        dark:bg-slate-950
        dark:focus-within:bg-slate-950
      ">
        <Lock
          size={17}
          className="
            shrink-0
            text-slate-400
          "
        />

        <input
          id={id}
          type="password"
          required
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={placeholder}
          className="
            min-w-0
            flex-1
            bg-transparent
            text-sm
            outline-none
            placeholder:text-slate-400
          "
        />
      </div>
    </div>
  );
}

export default ChangePassword;