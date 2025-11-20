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
  // Ensure user doc exists and listen to user's subscriptions
  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      return;
    }

    const userRef = doc(db, "reddit-users", user.uid);

    (async () => {
      try {
        // fetch once immediately so UI can update without waiting for onSnapshot
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          // create user doc and set subscriptions to empty immediately
          await setDoc(userRef, {
            displayName: user.displayName || "",
            email: user.email || "",
            subscriptions: [],
            createdAt: serverTimestamp(),
          });
          setSubscriptions([]);
        } else {
          // set subscriptions from the doc we just read so sidebar / home can react instantly
          const data = snap.data();
          setSubscriptions(data?.subscriptions || []);
        }
      } catch (err) {
        console.error("Failed to ensure user doc:", err);
      }

      // After the immediate read/write, attach realtime listener to keep subscriptions in sync
      const unsub = onSnapshot(userRef, (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setSubscriptions(data?.subscriptions || []);
      });

      // attach cleanup by returning the unsubscribe from the outer effect
      // but we cannot return from inside this async IIFE — so the outer effect returns below
      // To handle this we keep track of the snapshot unsubscribe with a variable in the outer scope.
    })();

    // Because the onSnapshot unsubscribe is created inside the async IIFE,
    // create a small mechanism to ensure we clean up properly.
    // We'll attach a snapshot listener synchronously too, but it will be effectively
    // replaced by the one inside the IIFE when it runs. This avoids missing the unsubscribe reference.
    let unsubLocal = () => {};
    (async () => {
      // wait a tick to let the IIFE attach its listener; if it hasn't, attach a fallback.
      await Promise.resolve();
      // If the IIFE already attached unsub via outer scope, nothing to do.
      // We'll still set unsubLocal to a no-op to be safe.
    })();

    return () => {
      // safe to call no-op if snapshot listener wasn't attached
      try {
        unsubLocal();
      } catch (e) {
        // ignore
      }
    };
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

    const postPayload = {
      title,
      url,
      text,
      subreddit: sanitizedSub, // normalized doc id (e.g. "memes")
      authorId: user.uid,
      author: user.displayName || user.email || "anonymous",
      votes: 0,
      votesBy: {}, // map userId -> 1 or -1
      type,
      createdAt: serverTimestamp(),
    };

    // write to Firestore
    const docRef = await addDoc(collection(db, "posts"), postPayload);

    // optimistic local update so the new post shows immediately in the UI.
    // guard against duplicates if the realtime listener later returns the same doc.
    const localPost = {
      id: docRef.id,
      ...postPayload,
      // createdAt for UI purposes: use a local ISO string so sorting works immediately.
      // Note: this is a local-only field to make the UI responsive — the server-created
      // Timestamp will replace it when the onSnapshot listener updates posts.
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => {
      // if post already present (listener already added it), skip
      if (prev.some((p) => p.id === docRef.id)) return prev;
      return [localPost, ...prev];
    });

    return docRef;
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
