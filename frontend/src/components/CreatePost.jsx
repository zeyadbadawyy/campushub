import { useState } from "react";

import {
  createPost
} from "../services/postService";

function CreatePost({
  onPostCreated
}) {

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit() {

    if (!content.trim()) {
      return;
    }

    try {

      setLoading(true);

      await createPost(content);

      setContent("");

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

      <button
        onClick={handleSubmit}
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