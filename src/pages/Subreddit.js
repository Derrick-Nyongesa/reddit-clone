import React from "react";
import { useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import PostCard from "../components/PostCard";

function Subreddit() {
  const { subredditId } = useParams();
  const { posts, subreddits, toggleSubscription, subscriptions } = useData();
  const sub = subreddits.find((s) => s.id === subredditId);
  const related = posts.filter((p) => p.subreddit === subredditId);
  const joined = subscriptions.includes(subredditId);

  if (!sub) return <div className="card">Subreddit not found</div>;

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>{sub.name}</h2>
          <div style={{ color: "#555" }}>{sub.description}</div>
        </div>
        <div>
          <button
            className={`btn ${joined ? "" : "btn-primary"}`}
            onClick={() => toggleSubscription(sub.id)}
          >
            {joined ? "Leave" : "Join"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {related.length === 0 ? (
          <div className="card">No posts in this subreddit</div>
        ) : (
          related.map((p) => <PostCard post={p} key={p.id} />)
        )}
      </div>
    </div>
  );
}

export default Subreddit;
