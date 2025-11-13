import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

function NewSubreddit() {
  const { createSubreddit } = useData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ff4500");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    if (!name) return alert("Please provide a subreddit name");
    createSubreddit({ name, description, theme: { color } });
    navigate("/");
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
          />
        </div>
        <div className="form-row">
          <label>Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Theme color</label>
          <input
            className="input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewSubreddit;
