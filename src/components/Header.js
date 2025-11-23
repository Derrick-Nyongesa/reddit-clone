import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaRedditAlien, FaPlus } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

function Header() {
  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // keep search text in sync with query param if user navigates directly
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // when query changes, debounce navigate to /search?q=
  useEffect(() => {
    // clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // if empty query, navigate to /search (without q) so page can show default
    debounceRef.current = setTimeout(() => {
      const trimmed = (query || "").trim();
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      } else {
        // if at search route already, keep it, otherwise don't redirect user away from where they are
        if (location.pathname === "/search") {
          navigate(`/search`);
        }
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // keep input in sync when user manually navigates with query param
  useEffect(() => {
    const p = new URLSearchParams(location.search).get("q") || "";
    setQuery(p);
  }, [location.search]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
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

      <input
        className="search"
        placeholder="Search posts or subreddits..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const trimmed = (query || "").trim();
            if (trimmed) {
              // immediate navigate
              if (debounceRef.current) clearTimeout(debounceRef.current);
              navigate(`/search?q=${encodeURIComponent(trimmed)}`);
            } else {
              navigate("/search");
            }
          }
        }}
      />

      <div className="nav-links">
        <Link
          to="/create"
          className="btn-ghost"
          style={{ backgroundColor: "#ff4500" }}
        >
          <FaPlus style={{ marginRight: 6 }} />
          New Post
        </Link>
        <Link to="/profile" className="nav-btn">
          {user && <div title={displayNameOrEmail}>{displayNameOrEmail}</div>}
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
