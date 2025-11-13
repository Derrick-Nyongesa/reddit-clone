import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRedditAlien, FaPlus } from "react-icons/fa";

function Header() {
  const navigate = useNavigate();
  return (
    <header className="header card">
      <div className="header-left">
        <div className="brand" onClick={() => navigate("/")}>
          <FaRedditAlien />
          <div>
            <div style={{ fontSize: 14 }}>Reddit Clone</div>
            <div style={{ fontSize: 11, color: "#666" }}>
              Front page of the Internet
            </div>
          </div>
        </div>
      </div>

      <input className="search" placeholder="Search posts or subreddits..." />

      <div className="nav-links">
        <Link to="/create" className="link-btn btn-ghost">
          <FaPlus style={{ marginRight: 6 }} />
          New Post
        </Link>
        <Link to="/profile" className="link-btn">
          Profile
        </Link>
      </div>
    </header>
  );
}

export default Header;
