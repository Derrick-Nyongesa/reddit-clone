import React from "react";
import { useData } from "../context/DataContext";
import Subreddit from "../pages/Subreddit";
import { Link } from "react-router-dom";

function Sidebar() {
  const { subreddits, subscriptions } = useData();
  return (
    <aside className="sidebar card">
      <h4>Subreddits</h4>
      <Subreddit items={subreddits} />
      <div style={{ marginTop: 12 }}>
        <h5>Your Joined</h5>
        {subscriptions.length === 0 ? (
          <div className="card">No subscriptions yet</div>
        ) : (
          <ul>
            {subscriptions.map((s) => (
              <li key={s}>
                <Link to={`/r/${s}`}>{s}</Link>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8 }}>
          <Link to="/new-subreddit" className="link-btn">
            Create
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
