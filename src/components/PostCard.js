import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useData } from "../context/DataContext";

function PostCard({ post }) {
  const { vote } = useData();
  return (
    <div className="card post">
      <div className="votes">
        <div className="vote-btn" onClick={() => vote(post.id, "up")}>
          <FaArrowUp />
        </div>
        <div style={{ fontWeight: 700 }}>{post.votes}</div>
        <div className="vote-btn" onClick={() => vote(post.id, "down")}>
          <FaArrowDown />
        </div>
      </div>
      <div className="post-body">
        <div className="post-meta">
          <div>{post.subreddit}</div>
          <div>•</div>
          <div>by {post.author}</div>
          <div>•</div>
          <div>{new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div className="post-title">{post.title}</div>
        {post.type === "link" && (
          <a
            className="post-link"
            href={post.url}
            target="_blank"
            rel="noreferrer"
          >
            {post.url}
          </a>
        )}
        {post.type === "image" && (
          <img src={post.url} alt={post.title} className="post-image" />
        )}
      </div>
    </div>
  );
}

export default PostCard;
