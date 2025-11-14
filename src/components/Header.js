import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRedditAlien, FaPlus } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

function Header() {
  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will update `user` to null
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSigningOut(false);
    }
  };

  const displayNameOrEmail = user
    ? user.displayName || user.email || "Signed in"
    : null;

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
          {user && (
            // non-clickable user display, keep same nav-btn styles
            <div className="nav-btn" title={displayNameOrEmail}>
              {displayNameOrEmail}
            </div>
          )}
        </Link>
        {user && (
          <button
            className="error-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
