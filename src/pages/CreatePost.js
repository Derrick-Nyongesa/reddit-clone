import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useData } from "../context/DataContext";

function CreatePost() {
  const { subreddits, createPost, subscriptions } = useData();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [type, setType] = useState("link");
  const [text, setText] = useState("");
  const navigate = useNavigate();

  // normalize helper
  const normalize = (s) => (s || "").replace(/^r\//i, "");

  // compute the subreddit objects the user has joined
  const normalizedSubs = (subscriptions || []).map((s) => normalize(s));
  const joinedSubreddits = subreddits.filter((s) =>
    normalizedSubs.includes(normalize(s.id))
  );

  // pick a default joined subreddit when available
  useEffect(() => {
    if (joinedSubreddits.length && !subreddit) {
      setSubreddit(joinedSubreddits[0].id);
    }
  }, [joinedSubreddits, subreddit]);

  async function submit(e) {
    e.preventDefault();
    if (!title) return alert("Please add a title");
    if ((type === "link" || type === "image") && !url)
      return alert("Please add a url for link or image posts");

    try {
      // ensure we pass normalized subreddit (doc id like 'memes')
      const sanitizedSub = (subreddit || "")
        .replace(/^r\//i, "")
        .replace(/\s+/g, "");
      await createPost({ title, url, subreddit: sanitizedSub, type, text });
      navigate("/");
    } catch (err) {
      alert(err?.message || "Failed to create post");
    }
  }

  // If user hasn't joined any subreddit, hide the form and show a message
  if (!joinedSubreddits.length) {
    return (
      <div>
        <h2>Create Post</h2>
        <div className="card">
          <p>
            You must join at least one subreddit to create a post.
            <br />
            Join a community from the sidebar or{" "}
            <Link to="/new-subreddit" className="link-btn">
              create a new subreddit
            </Link>
            .
          </p>
        </div>
      </div>
    );
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
          <label>Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="link">Link</option>
            <option value="image">Image</option>
            <option value="text">Text</option>
          </select>
        </div>

        {(type === "link" || type === "image") && (
          <div className="form-row">
            <label>URL or Image</label>
            <input
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        )}

        {type === "text" && (
          <div className="form-row">
            <label>Text</label>
            <textarea
              className="input"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <label>Subreddit</label>
          <select
            className="input"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
          >
            {joinedSubreddits.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
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
