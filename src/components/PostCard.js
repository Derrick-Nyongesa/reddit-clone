import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

function PostCard({ post }) {
  const { vote, subreddits } = useData();
  const { user } = useAuth();
  const sub = subreddits.find((s) => s.id === post.subreddit);
  const userVote = (post.votesBy && user && post.votesBy[user.uid]) || 0;
  const color = sub?.theme?.color || "#ff4500";

  // disable voting if current user is the post author (or not logged in)
  const isAuthor = user && post.authorId === user.uid;

  function handleVote(dir) {
    if (!user) return alert("Please sign in to vote");
    if (isAuthor) return alert("You cannot vote on your own post");
    vote(post.id, dir);
  }

  const createdAt = post.createdAt
    ? post.createdAt.toDate
      ? post.createdAt.toDate().toLocaleString()
      : new Date(post.createdAt).toLocaleString()
    : "";

  return (
    <div className="card post">
      <div className="votes">
        <div
          className="vote-btn"
          onClick={() => handleVote("up")}
          style={{
            color: userVote === 1 ? color : undefined,
            cursor: isAuthor ? "not-allowed" : undefined,
            opacity: isAuthor ? 0.5 : 1,
          }}
          title={isAuthor ? "You cannot vote on your own post" : "Upvote"}
        >
          <FaArrowUp />
        </div>
        <div style={{ fontWeight: 700 }}>{post.votes}</div>
        <div
          className="vote-btn"
          onClick={() => handleVote("down")}
          style={{
            color: userVote === -1 ? color : undefined,
            cursor: isAuthor ? "not-allowed" : undefined,
            opacity: isAuthor ? 0.5 : 1,
          }}
          title={isAuthor ? "You cannot vote on your own post" : "Downvote"}
        >
          <FaArrowDown />
        </div>
      </div>
      <div className="post-body">
        <div className="post-meta">
          <div>{post.subreddit}</div>
          <div>•</div>
          <div>by {post.author}</div>
          <div>•</div>
          <div>{createdAt}</div>
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
        {post.type === "text" && <div className="post-text">{post.text}</div>}
      </div>
    </div>
  );
}

export default PostCard;
