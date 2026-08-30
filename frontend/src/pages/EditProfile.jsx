import { useEffect, useState } from "react";

import {
  FaUserCircle,
  FaCamera,
  FaTrash
} from "react-icons/fa";

import MainLayout
  from "../layouts/MainLayout";

import {
  getCurrentUser
} from "../services/auth";

import {
  updateProfile,
  uploadAvatar,
  deleteAvatar
} from "../services/postService";

import {
  useNavigate
} from "react-router-dom";

function EditProfile() {

  const [
    formData,
    setFormData
  ] = useState({
    name: "",
    bio: "",
    faculty: ""
  });

  const [
    loading,
    setLoading
  ] = useState(false);

  const navigate =
    useNavigate();

  const [
    avatar,
    setAvatar
  ] = useState("");

  const [
    uploadingAvatar,
    setUploadingAvatar
  ] = useState(false);

  useEffect(() => {

    async function loadUser() {

      try {

        const user =
          await getCurrentUser();

        setFormData({
          name: user.name || "",
          bio: user.bio || "",
          faculty: user.faculty || ""
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

  async function handleAvatarUpload(
    e
  ) {

    const file =
      e.target.files[0];

    if (!file)
      return;

    try {

      setUploadingAvatar(
        true
      );

      const result =
        await uploadAvatar(
          file
        );

      setAvatar(
        result.url
      );

    } catch (error) {

      console.error(
        error
      );

    } finally {

      setUploadingAvatar(
        false
      );

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

  async function handleSubmit(
    e
  ) {

    e.preventDefault();

    try {

      setLoading(true);

      await updateProfile(
        formData
      );

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

  return (

    <MainLayout>

      <div className="edit-profile-page">

        <div className="edit-profile-card">

          <div className="edit-profile-header">

            <h1>

              Edit Profile

            </h1>

            <p>

              Update your information and keep your profile fresh.

            </p>

          </div>

          <form
            onSubmit={handleSubmit}
          >

            <div className="avatar-upload-card">

              <div className="avatar-preview">

                {avatar ? (

                  <img
                    src={avatar}
                    alt="avatar"
                  />

                ) : (

                  <FaUserCircle />
                )}

              </div>

              <div className="avatar-actions">

                <label className="avatar-upload-btn">

                  <FaCamera />

                  {
                    uploadingAvatar
                      ? "Uploading..."
                      : "Change Photo"
                  }

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
                    className="avatar-remove-btn"
                    onClick={
                      handleDeleteAvatar
                    }
                  >
                    <FaTrash />
                    Remove
                  </button>

                )}

              </div>

            </div>

            <div className="form-group">

              <label>

                Full Name

              </label>

              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name:
                      e.target.value
                  })
                }
              />

            </div>

            <div className="form-group">

              <label>

                Faculty

              </label>

              <input
                type="text"
                value={formData.faculty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    faculty:
                      e.target.value
                  })
                }
              />

            </div>

            <div className="form-group">

              <label>

                Bio

              </label>

              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bio:
                      e.target.value
                  })
                }
              />

            </div>

            <div className="edit-profile-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate(-1)
                }
              >

                Cancel

              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >

                {
                  loading
                    ? "Saving..."
                    : "Save Changes"
                }

              </button>

            </div>

          </form>

        </div>

      </div>

    </MainLayout>

  );

}

export default EditProfile;