import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

function Profile() {
  const { posts, subscriptions } = useData();
  const { user } = useAuth();

  // show nothing / loader if auth or posts still loading
  // if (loading) return <div className="card">Loading...</div>;
  if (!user)
    return (
      <div className="card">
        <div>Please sign in to view your profile.</div>
      </div>
    );

  const displayNameOrEmail = user.displayName || user.email || "User";

  // filter posts by authorId (reliable) and sort newest-first
  const userPosts = useMemo(() => {
    return posts
      .filter((p) => p.authorId === user.uid)
      .sort((a, b) => {
        const ta = a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const tb = b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return tb - ta;
      });
  }, [posts, user]);

  return (
    <div>
      <h2>Profile</h2>

      <div className="card">
        <div>
          <strong>Username:</strong> {displayNameOrEmail}
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Joined subs:</strong>{" "}
          {subscriptions && subscriptions.length > 0
            ? subscriptions.map((s) => s.replace(/^r\//i, "r/")).join(", ")
            : "None"}
        </div>
      </div>

      <h3 style={{ marginTop: 12 }}>Your posts</h3>

      {userPosts.length === 0 ? (
        <div className="card">You have no posts yet</div>
      ) : (
        userPosts.map((p) => <PostCard post={p} key={p.id} />)
      )}
    </div>
  );
}

export default Profile;
