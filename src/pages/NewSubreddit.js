import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

function NewSubreddit() {
  const { createSubreddit } = useData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ff4500");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!name) return alert("Please provide a subreddit name");
    // keep IDs consistent with your DataContext (r/<name>)
    const sanitized = name.replace(/\s+/g, "");
    setSubmitting(true);
    try {
      await createSubreddit({ name: sanitized, description, theme: { color } });
      navigate(`/r/${sanitized}`);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to create subreddit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Create Subreddit</h2>
      <form className="card" onSubmit={submit}>
        <div className="form-row">
          <label>Name (no spaces, e.g. mysub)</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, ""))}
            placeholder="mysub"
          />
        </div>

        <div className="form-row">
          <label>Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description"
          />
        </div>

        <div className="form-row" style={{ alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label>Theme color</label>
            <input
              className="input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#ff4500"
            />
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              marginLeft: 12,
              background: color,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
            aria-hidden
          />
        </div>

        <div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewSubreddit;
