import React from "react";
import { useData } from "../context/DataContext";

function Profile() {
  const { posts, subscriptions } = useData();

  return (
    <div>
      <h2>Profile</h2>
      <div className="card">
        <div>
          <strong>Username:</strong> anonymous
        </div>
        <div>
          <strong>Joined subs:</strong> {subscriptions.join(", ") || "None"}
        </div>
      </div>

      <h3 style={{ marginTop: 12 }}>Your posts</h3>
      {posts.filter((p) => p.author === "anonymous").length === 0 && (
        <div className="card">You have no posts yet</div>
      )}
      {posts
        .filter((p) => p.author === "anonymous")
        .map((p) => (
          <div className="card" key={p.id}>
            {p.title}
          </div>
        ))}
    </div>
  );
}

export default Profile;
