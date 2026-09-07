import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Trash2,
  Save,
  ArrowLeft,
  UserRound,
  GraduationCap,
  FileText,
  Loader2,
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";

import {
  getCurrentUser,
} from "../services/auth";

import {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "../services/postService";

import {
  useNavigate,
} from "react-router-dom";

function EditProfile() {
  const [formData, setFormData] =
    useState({
      name: "",
      bio: "",
      faculty: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [avatar, setAvatar] =
    useState("");

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const user =
          await getCurrentUser();

        setFormData({
          name: user.name || "",
          bio: user.bio || "",
          faculty: user.faculty || "",
        });

        setAvatar(
          user.avatar_url || ""
        );
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  async function handleAvatarUpload(e) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingAvatar(true);

      const result =
        await uploadAvatar(file);

      setAvatar(result.url);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeleteAvatar() {
    try {
      await deleteAvatar();
      setAvatar("");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await updateProfile(formData);

      const user =
        await getCurrentUser();

      navigate(
        `/profile/${user.id}`
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

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
            flex items-center gap-3
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
              <UserRound size={21} />
            </div>

            <div>
              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Edit Profile
              </h1>

              <p className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Keep your CampusHub profile
                up to date.
              </p>
            </div>
          </div>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Avatar Card */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
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
              mb-5
            ">
              <h2 className="
                text-sm
                font-semibold
              ">
                Profile photo
              </h2>

              <p className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              ">
                Use a clear photo so other
                students can recognize you.
              </p>
            </div>

            <div className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
            ">
              <div className="
                flex
                h-28
                w-28
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-[28px]
                bg-indigo-50
                text-indigo-300
                dark:bg-indigo-500/10
                dark:text-indigo-400
              ">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  <UserRound
                    size={42}
                  />
                )}
              </div>

              <div>
                <div className="
                  flex
                  flex-wrap
                  gap-2
                ">
                  <label
                    className="
                      inline-flex
                      cursor-pointer
                      items-center
                      gap-2
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
                    <Camera size={16} />

                    {uploadingAvatar
                      ? "Uploading..."
                      : "Change Photo"}

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={
                        handleAvatarUpload
                      }
                    />
                  </label>

                  {avatar && (
                    <button
                      type="button"
                      onClick={
                        handleDeleteAvatar
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4 py-2.5
                        text-sm
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-50
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-red-400
                        dark:hover:bg-red-500/10
                      "
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>

                <p className="
                  mt-3
                  text-xs
                  text-slate-400
                ">
                  JPG, PNG or other standard
                  image formats.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Basic information */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
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
            <div className="mb-5">
              <h2 className="
                text-sm
                font-semibold
              ">
                Personal information
              </h2>

              <p className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              ">
                Tell the campus community
                a little about yourself.
              </p>
            </div>

            <div className="space-y-5">

              {/* Name */}

              <div>
                <label
                  htmlFor="profile-name"
                  className="
                    mb-2
                    flex items-center
                    gap-2
                    text-sm
                    font-medium
                  "
                >
                  <UserRound size={15} />
                  Full Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    text-sm
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:focus:bg-slate-950
                  "
                />
              </div>

              {/* Faculty */}

              <div>
                <label
                  htmlFor="profile-faculty"
                  className="
                    mb-2
                    flex items-center
                    gap-2
                    text-sm
                    font-medium
                  "
                >
                  <GraduationCap
                    size={15}
                  />
                  Faculty
                </label>

                <input
                  id="profile-faculty"
                  type="text"
                  value={formData.faculty}
                  onChange={(e) =>
                    updateField(
                      "faculty",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Computer Science"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    text-sm
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:focus:bg-slate-950
                  "
                />
              </div>

              {/* Bio */}

              <div>
                <div className="
                  mb-2
                  flex
                  items-center
                  justify-between
                ">
                  <label
                    htmlFor="profile-bio"
                    className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-medium
                    "
                  >
                    <FileText
                      size={15}
                    />
                    Bio
                  </label>

                  <span className="
                    text-xs
                    text-slate-400
                  ">
                    {formData.bio.length}
                  </span>
                </div>

                <textarea
                  id="profile-bio"
                  value={formData.bio}
                  onChange={(e) =>
                    updateField(
                      "bio",
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="Tell people a little about yourself..."
                  className="
                    min-h-[130px]
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    text-sm
                    leading-6
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-500/10
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:focus:bg-slate-950
                  "
                />
              </div>
            </div>
          </motion.section>

          {/* Actions */}

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
              delay: 0.15,
            }}
            className="
              flex
              flex-col-reverse
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
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
              disabled={
                loading ||
                uploadingAvatar
              }
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
                shadow-sm
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
                <Save size={16} />
              )}

              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          </motion.div>
        </form>
      </div>
    </MainLayout>
  );
}

export default EditProfile;