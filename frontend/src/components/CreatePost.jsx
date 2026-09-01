import { useState, useRef, useEffect } from "react";

import {
  FaCameraRetro,
  FaImage,
  FaTimes
} from "react-icons/fa";

import {
  createPost,
  uploadPostImage,
  searchGifs
} from "../services/postService";

function CreatePost({
  onPostCreated
}) {

  const fileInputRef = useRef(null);

  const [content, setContent] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [gifUrl, setGifUrl] =
    useState("");

  const [showGifInput, setShowGifInput] =
    useState(false);

  const [preview, setPreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showGiphy, setShowGiphy] =
    useState(false);

  const [gifSearch, setGifSearch] =
    useState("");

  const [gifResults, setGifResults] =
    useState([]);
  
  async function handleSubmit() {

    if (
      !content.trim() &&
      !image &&
      !gifUrl.trim()
    ) {
      return;
    }

    try {

      setLoading(true);

      let imageUrl = "";

      if (image) {

        const uploadResult =
          await uploadPostImage(
            image
          );

        imageUrl =
          uploadResult.url;

      }

      await createPost(
        content,
        imageUrl,
        gifUrl
      );

      setContent("");
      setImage(null);
      setGifUrl("");
      setShowGifInput(false);

      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      onPostCreated();

    } catch (error) {

      console.error(error);

      alert(
        "Failed to create post"
      );

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    if (!gifSearch.trim()) {
      setGifResults([]);
      return;
    }

    const timer = setTimeout(async () => {

      try {
        const gifs = await searchGifs(gifSearch);

        setGifResults(gifs);

      } catch (error) {

        console.error(error);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);

  }, [gifSearch]);

  function closeGiphy() {

    setShowGiphy(false);

    setGifSearch("");

    setGifResults([]);

  }

  useEffect(() => {

    return () => {

      if (preview) {

        URL.revokeObjectURL(
          preview
        );

      }

    };

  }, [preview]);

  return (

    <div className="create-post">

      <textarea
        placeholder="What's happening on campus?"
        value={content}
        onChange={(e) =>
          setContent(
            e.target.value
          )
        }
      />

      <div className="create-post-actions">

        <input
          ref={fileInputRef}
          id="post-image"
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {

            const file =
              e.target.files[0];

            if (!file) {
              return;
            }

            setGifUrl("");

            if (preview) {
              URL.revokeObjectURL(
                preview
              );
            }

            setImage(file);

            setPreview(
              URL.createObjectURL(
                file
              )
            );

          }}
        />

        <label
          htmlFor="post-image"
          className="image-toggle-btn"
        >
          <FaCameraRetro />
          Photo
        </label>

        <label
          type="button"
          className="image-toggle-btn"
          onClick={() =>
            setShowGifInput(
              !showGifInput
            )
          }
        >
          <FaImage />
          GIF
        </label>

        <label
          className="image-toggle-btn"
          onClick={() =>
            setShowGiphy(true)
          }
        >
          🔥 Giphy
        </label>

      </div>

      {
        showGifInput && (

          <input
            type="text"
            placeholder="Paste GIF URL..."
            value={gifUrl}
            onChange={(e) => {

              setImage(null);

              if (preview) {

                URL.revokeObjectURL(
                  preview
                );

              }

              setPreview("");

              if (
                fileInputRef.current
              ) {
                fileInputRef.current.value =
                  "";
              }

              setGifUrl(
                e.target.value
              );

            }}
            className="gif-input"
          />

        )
      }

      {
        preview && (

          <div className="preview-container">

            <img
              src={preview}
              alt="preview"
              className="post-preview"
            />

            <button
              type="button"
              className="remove-image-btn"
              onClick={() => {

                setImage(null);

                URL.revokeObjectURL(
                  preview
                );

                setPreview("");

                if (
                  fileInputRef.current
                ) {
                  fileInputRef.current.value =
                    "";
                }

              }}
            >
              <FaTimes />
            </button>

          </div>

        )
      }

      {
        gifUrl && (

          <div className="preview-container">

            <img
              src={gifUrl}
              alt="gif"
              className="post-preview"
            />

            <button
              type="button"
              className="remove-image-btn"
              onClick={() =>
                setGifUrl("")
              }
            >
              <FaTimes />
            </button>

          </div>

        )
      }

      {
        showGiphy && (

          <div
            className="giphy-modal"
            onClick={closeGiphy}
          >

            <div
              className="giphy-box"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="giphy-header">

                <input
                  className="gif-input"
                  type="text"
                  placeholder="Search GIFs..."
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  autoFocus
                />

              </div>

              <div
                className="giphy-grid"
              >

                {
                  gifResults.map(
                    gif => (

                      <img
                        key={gif.id}
                        src={
                          gif.images.fixed_height.url
                        }
                        alt=""
                        onClick={() => {

                          setGifUrl(
                            gif.images.original.url
                          );

                          closeGiphy();

                        }}
                      />

                    )
                  )
                }

              </div>

            </div>

          </div>

        )
      }

      <button
        className="post-submit-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {
          loading
            ? "Posting..."
            : "Post"
        }
      </button>

    </div>

  );

}

export default CreatePost;