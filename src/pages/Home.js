import React from "react";
import { useData } from "../context/DataContext";
import PostCard from "../components/PostCard";

function Home() {
  const { posts } = useData();
  return (
    <div>
      <h2>Home</h2>
      <div style={{ marginTop: 12 }}>
        {posts.length === 0 ? (
          <div className="card">No posts yet</div>
        ) : (
          posts.map((p) => <PostCard post={p} key={p.id} />)
        )}
      </div>
    </div>
  );
}

export default Home;
