import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db, serverTimestamp } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [subreddits, setSubreddits] = useState([]);
  const [posts, setPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ensure user doc exists and listen to user's subscriptions
  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    (async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            displayName: user.displayName || "",
            email: user.email || "",
            subscriptions: [],
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Failed to ensure user doc:", err);
      }
    })();

    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.exists() ? snap.data() : null;
      setSubscriptions(data?.subscriptions || []);
    });

    return () => unsub();
  }, [user]);

  // Realtime subreddits
  useEffect(() => {
    const q = query(collection(db, "subreddits"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubreddits(arr);
    });
    return () => unsub();
  }, []);

  // Realtime posts ordered newest first
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
        };
      });
      setPosts(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Create a post (text, link or image)
  async function createPost({
    title,
    url = "",
    subreddit,
    type = "link",
    text = "",
  }) {
    if (!user) throw new Error("Not authenticated");
    const post = {
      title,
      url,
      text,
      subreddit, // doc id like 'r/memes'
      authorId: user.uid,
      author: user.displayName || user.email || "anonymous",
      votes: 0,
      votesBy: {}, // map userId -> 1 or -1
      type,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "posts"), post);
  }

  // Create subreddit
  async function createSubreddit({
    name,
    description = "",
    theme = { color: "#ff4500" },
  }) {
    if (!user) throw new Error("Not authenticated");

    // sanitize input: remove leading "r/" if present and spaces
    const sanitized = name.replace(/^r\//i, "").replace(/\s+/g, "");
    const docId = sanitized; // <-- single segment, safe for Firestore doc id
    const subRef = doc(db, "subreddits", docId);

    await setDoc(subRef, {
      title: sanitized,
      name: sanitized,
      description,
      theme,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });

    // store subscription value as 'r/<name>' so your routes and posts can keep same format
    const routeId = `r/${sanitized}`;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { subscriptions: arrayUnion(routeId) });
  }

  // Toggle subscription (join / leave)
  async function toggleSubscription(subId) {
    if (!user) throw new Error("Not authenticated");
    const subRef = doc(db, "subreddits", subId);
    const userRef = doc(db, "users", user.uid);
    const joined = subscriptions.includes(subId);

    if (joined) {
      await updateDoc(subRef, { members: arrayRemove(user.uid) });
      await updateDoc(userRef, { subscriptions: arrayRemove(subId) });
    } else {
      await updateDoc(subRef, { members: arrayUnion(user.uid) });
      await updateDoc(userRef, { subscriptions: arrayUnion(subId) });
    }
  }

  // Vote transaction: dir is "up" or "down"
  async function vote(postId, dir) {
    if (!user) throw new Error("Not authenticated");
    const postRef = doc(db, "posts", postId);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(postRef);
        if (!snap.exists()) throw new Error("Post not found");
        const data = snap.data();
        const votesBy = data.votesBy || {};
        const prev = votesBy[user.uid] || 0; // 1, -1 or 0
        const direction = dir === "up" ? 1 : -1;
        let newVotes = data.votes || 0;

        // undo same vote
        if (prev === direction) {
          newVotes = newVotes - direction;
          // set user vote to 0 (you can change to delete the field if you add deleteField)
          t.update(postRef, { votes: newVotes, [`votesBy.${user.uid}`]: 0 });
          return;
        }

        // switching vote (e.g. up -> down)
        if (prev !== 0 && prev !== direction) {
          newVotes = newVotes + direction * 2;
        } else {
          newVotes = newVotes + direction;
        }

        t.update(postRef, {
          votes: newVotes,
          [`votesBy.${user.uid}`]: direction,
        });
      });
    } catch (err) {
      console.error("Vote failed", err);
    }
  }

  // Derived feeds
  const homePosts = posts;
  const joinedPosts = posts.filter((p) => subscriptions.includes(p.subreddit));

  return (
    <DataContext.Provider
      value={{
        posts: homePosts,
        joinedPosts,
        subreddits,
        subscriptions,
        loading,
        createPost,
        vote,
        createSubreddit,
        toggleSubscription,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
