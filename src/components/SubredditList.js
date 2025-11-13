import React from "react";
import { Link } from "react-router-dom";

function SubredditList({ items = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((s) => (
        <div className="subreddit-item card" key={s.id}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="subreddit-badge">{s.name}</div>
            <div style={{ fontSize: 13, color: "#444" }}>{s.description}</div>
          </div>
          <div>
            <Link to={`/r/${s.id}`} className="link-btn">
              Visit
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SubredditList;
