import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import PostCard from "../components/PostCard";

function Subreddit() {
  const { subredditId } = useParams();
  const { posts, subreddits, toggleSubscription, subscriptions } = useData();
  const [toggling, setToggling] = useState(false);

  const sub = subreddits.find((s) => s.id === subredditId);
  const related = posts.filter(
    (p) => p.subreddit === subredditId.replace(/^r\//i, "")
  );
  const joined = subscriptions.includes(subredditId);

  // helper to pick readable text color for header
  const headerTextColor = useMemo(() => {
    const hex = (sub?.theme?.color || "#ff4500").replace("#", "");
    if (hex.length < 6) return "#fff";
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // YIQ contrast formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  }, [sub]);

  if (!sub) return <div className="card">Subreddit not found</div>;

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleSubscription(sub.id);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to update subscription");
    } finally {
      setToggling(false);
    }
  }

  const memberCount = Array.isArray(sub.members) ? sub.members.length : 0;

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 0,
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "20px 16px",
            background: sub.theme?.color || "#ff4500",
            color: headerTextColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{sub.name}</h2>
            <div style={{ opacity: 0.95 }}>{sub.description}</div>
          </div>

          <div style={{ textAlign: "right", minWidth: 140 }}>
            <div style={{ fontSize: 14, opacity: 0.95 }}>
              {memberCount} members
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                className={`btn ${joined ? "" : "btn-primary"}`}
                onClick={handleToggle}
                disabled={toggling}
              >
                {toggling ? "..." : joined ? "Leave" : "Join"}
              </button>
            </div>
          </div>
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
