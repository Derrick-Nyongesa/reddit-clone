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

    const userRef = doc(db, "reddit-users", user.uid);

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

    // normalize subreddit to always store just the doc id (no leading "r/")
    const sanitizedSub = (subreddit || "")
      .replace(/^r\//i, "")
      .replace(/\s+/g, "");

    const post = {
      title,
      url,
      text,
      // store normalized doc id (e.g. "memes") — code elsewhere tolerates either form
      subreddit: sanitizedSub,
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

    // Prepare the subreddit object we'll write to Firestore and also use locally
    const subPayload = {
      title: sanitized,
      name: sanitized,
      description,
      theme,
      members: [user.uid],
      createdAt: serverTimestamp(),
    };

    // Write to Firestore
    await setDoc(subRef, subPayload);

    // Locally add the subreddit immediately so routes that navigate to it see it
    setSubreddits((prev) => {
      // if already present (rare, but safe), don't duplicate
      if (prev.some((s) => s.id === docId)) return prev;
      // create a lightweight local object — createdAt is a local Date to make UI readable
      const localSub = {
        id: docId,
        title: sanitized,
        name: sanitized,
        description,
        theme,
        members: [user.uid],
        createdAt: new Date().toISOString(),
      };
      return [localSub, ...prev];
    });

    // store subscription value as 'r/<name>' in user doc (keeps UI consistent)
    const routeId = `r/${sanitized}`;
    const userRef = doc(db, "reddit-users", user.uid);
    await updateDoc(userRef, { subscriptions: arrayUnion(routeId) });
  }

  // Toggle subscription (join / leave)
  async function toggleSubscription(subId) {
    if (!user) throw new Error("Not authenticated");
    const subRef = doc(db, "subreddits", subId);
    const userRef = doc(db, "reddit-users", user.uid);

    // subscriptions in user doc are stored as 'r/<name>' — compute that form
    const routeId = `r/${subId}`;
    const joined = subscriptions.includes(routeId);

    if (joined) {
      await updateDoc(subRef, { members: arrayRemove(user.uid) });
      await updateDoc(userRef, { subscriptions: arrayRemove(routeId) });
    } else {
      await updateDoc(subRef, { members: arrayUnion(user.uid) });
      await updateDoc(userRef, { subscriptions: arrayUnion(routeId) });
    }
  }

  // Vote transaction: dir is "up" or "down"
  // Vote transaction: dir is "up" or "down"
  async function vote(postId, dir) {
    if (!user) throw new Error("Not authenticated");
    const postRef = doc(db, "posts", postId);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(postRef);
        if (!snap.exists()) throw new Error("Post not found");
        const data = snap.data();

        // server-side guard: authors cannot vote on their own posts
        if (data.authorId === user.uid) {
          throw new Error("Authors cannot vote on their own posts");
        }

        const votesBy = data.votesBy || {};
        const prev = votesBy[user.uid] || 0; // 1, -1 or 0
        const direction = dir === "up" ? 1 : -1;
        let newVotes = data.votes || 0;

        // undo same vote
        if (prev === direction) {
          newVotes = newVotes - direction;
          // set user vote to 0 (alternatively delete the field)
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
      // surface author-block message gracefully
      if (err?.message?.includes("Authors cannot vote")) {
        console.warn(err.message);
        return;
      }
      console.error("Vote failed", err);
    }
  }

  // helper normalizer: remove leading r/ if present
  const normalize = (s) => (s || "").replace(/^r\//i, "");

  // Derived feeds
  const homePosts = posts;

  // Joined posts: match post.subreddit (which we store as doc id like 'memes')
  // against the user's subscriptions (which are stored as 'r/memes').
  const joinedPosts = posts.filter((p) => {
    const postSub = normalize(p.subreddit);
    return subscriptions.some((s) => normalize(s) === postSub);
  });

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
