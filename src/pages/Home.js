import React from "react";
import { useData } from "../context/DataContext";
import PostCard from "../components/PostCard";

function Home() {
  const { joinedPosts } = useData();
  return (
    <div>
      <h2>Home</h2>
      <div style={{ marginTop: 12 }}>
        {joinedPosts.length === 0 ? (
          <div className="card">
            No posts yet — join some subreddits to see posts
          </div>
        ) : (
          joinedPosts.map((p) => <PostCard post={p} key={p.id} />)
        )}
      </div>
    </div>
  );
}

export default Home;
