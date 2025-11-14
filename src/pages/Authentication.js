import { useState, useEffect } from "react";
import { googleProvider, auth } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Authentication() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // If already signed in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged (AuthProvider) will update user and navigate will run
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-sub">
          This application is a fully-functional Reddit-inspired web platform
          built with React, designed to allow users to browse, create, and
          interact with community-driven content. The app focuses on simplicity,
          performance, and clean UI while providing the core features users
          expect from a modern content-sharing platform.
        </p>

        <button
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>

        {error && <div className="auth-error">Error: {error}</div>}
      </div>
    </div>
  );
}

export default Authentication;
