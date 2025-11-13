import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

function CreatePost() {
  const { subreddits, createPost } = useData();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subreddit, setSubreddit] = useState(subreddits[0]?.id || "");
  const [type, setType] = useState("link");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    if (!title || !url) return alert("Please add a title and a url or image");
    createPost({ title, url, subreddit, type });
    navigate("/");
  }

  return (
    <div>
      <h2>Create Post</h2>
      <form
        className="card"
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div className="form-row">
          <label>Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>URL or Image</label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Subreddit</label>
          <select
            className="input"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
          >
            {subreddits.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="link">Link</option>
            <option value="image">Image</option>
          </select>
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Post
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;
