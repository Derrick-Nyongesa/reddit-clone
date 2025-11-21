// src/context/DataContext.js
import { createContext, useContext, useEffect, useRef, useState } from "react";
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
} from "firebase/firestore";

const DataContext = createContext();

export function DataProvider({ children }) {
  // <-- get both user AND initializing from AuthContext
  const { user, initializing } = useAuth();

  const [subreddits, setSubreddits] = useState([]);
  const [posts, setPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const subsRef = useRef(null);
  const postsRef = useRef(null);
  const userRefUnsub = useRef(null);

  // --- Subreddits realtime listener (attach only after auth finished and user exists) ---
  useEffect(() => {
    // Wait for auth to finish initializing
    if (initializing) return;

    // If not signed in, clear and don't attach listeners (rules require auth)
    if (!user || !user.uid) {
      if (subsRef.current) {
        subsRef.current();
        subsRef.current = null;
      }
      setSubreddits([]);
      return;
    }

    const q = query(collection(db, "subreddits"));
    subsRef.current = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.debug(
          "[DataContext] subreddits snapshot:",
          arr.length,
          "items"
        );
        setSubreddits(arr);
      },
      (err) => {
        console.error("[DataContext] subreddits snapshot error:", err);
      }
    );

    return () => {
      if (subsRef.current) subsRef.current();
      subsRef.current = null;
    };
  }, [user?.uid, initializing]);

  // --- Posts realtime listener (attach only after auth finished and user exists) ---
  useEffect(() => {
    if (initializing) return;

    if (!user || !user.uid) {
      if (postsRef.current) {
        postsRef.current();
        postsRef.current = null;
      }
      setPosts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    postsRef.current = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.debug("[DataContext] posts snapshot:", arr.length, "items");
        setPosts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("[DataContext] posts snapshot error:", err);
      }
    );

    return () => {
      if (postsRef.current) postsRef.current();
      postsRef.current = null;
    };
  }, [user?.uid, initializing]);

  // --- Per-user subscription listener (attach after auth finished) ---
  useEffect(() => {
    // cleanup prior user listener
    if (userRefUnsub.current) {
      userRefUnsub.current();
      userRefUnsub.current = null;
    }

    if (initializing) {
      // don't change anything until auth finished
      return;
    }

    if (!user || !user.uid) {
      console.debug("[DataContext] no user — clearing subscriptions");
      setSubscriptions([]);
      return;
    }

    const userDocRef = doc(db, "reddit-users", user.uid);

    userRefUnsub.current = onSnapshot(
      userDocRef,
      async (snap) => {
        try {
          if (!snap.exists()) {
            console.debug(
              "[DataContext] user doc missing — creating:",
              user.uid
            );
            await setDoc(userDocRef, {
              displayName: user.displayName || "",
              email: user.email || "",
              subscriptions: [],
              createdAt: serverTimestamp(),
            });
            setSubscriptions([]);
            return;
          }

          const data = snap.data();
          console.debug(
            "[DataContext] user snapshot for",
            user.uid,
            "subscriptions:",
            data?.subscriptions || []
          );
          setSubscriptions(data?.subscriptions || []);
        } catch (err) {
          console.error("[DataContext] error in user snapshot handler:", err);
        }
      },
      (err) => {
        console.error("[DataContext] user snapshot error:", err);
      }
    );

    return () => {
      if (userRefUnsub.current) {
        userRefUnsub.current();
        userRefUnsub.current = null;
      }
    };
  }, [user?.uid, initializing]);

  // -------------------------
  // CRUD operations & helpers
  // -------------------------

  async function createPost({
    title,
    url = "",
    subreddit,
    type = "link",
    text = "",
  }) {
    if (!user) throw new Error("Not authenticated");

    const sanitizedSub = (subreddit || "")
      .replace(/^r\//i, "")
      .replace(/\s+/g, "");

    const postPayload = {
      title,
      url,
      text,
      subreddit: sanitizedSub,
      authorId: user.uid,
      author: user.displayName || user.email || "anonymous",
      votes: 0,
      votesBy: {},
      type,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "posts"), postPayload);

    const localPost = {
      id: docRef.id,
      ...postPayload,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.some((p) => p.id === docRef.id) ? prev : [localPost, ...prev]
    );

    return docRef;
  }

  async function createSubreddit({
    name,
    description = "",
    theme = { color: "#ff4500" },
  }) {
    if (!user) throw new Error("Not authenticated");

    const sanitized = name.replace(/^r\//i, "").replace(/\s+/g, "");
    const docId = sanitized;
    const subRef = doc(db, "subreddits", docId);

    const subPayload = {
      title: sanitized,
      name: sanitized,
      description,
      theme,
      members: [user.uid],
      createdAt: serverTimestamp(),
    };

    await setDoc(subRef, subPayload);

    setSubreddits((prev) => {
      if (prev.some((s) => s.id === docId)) return prev;
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

    const routeId = `r/${sanitized}`;
    const userRef = doc(db, "reddit-users", user.uid);
    await updateDoc(userRef, { subscriptions: arrayUnion(routeId) });
  }

  async function toggleSubscription(subId) {
    if (!user) throw new Error("Not authenticated");
    const subRef = doc(db, "subreddits", subId);
    const userRef = doc(db, "reddit-users", user.uid);
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

  async function vote(postId, dir) {
    if (!user) throw new Error("Not authenticated");
    const postRef = doc(db, "posts", postId);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(postRef);
        if (!snap.exists()) throw new Error("Post not found");
        const data = snap.data();

        if (data.authorId === user.uid) {
          throw new Error("Authors cannot vote on their own posts");
        }

        const votesBy = data.votesBy || {};
        const prev = votesBy[user.uid] || 0;
        const direction = dir === "up" ? 1 : -1;
        let newVotes = data.votes || 0;

        if (prev === direction) {
          newVotes = newVotes - direction;
          t.update(postRef, { votes: newVotes, [`votesBy.${user.uid}`]: 0 });
          return;
        }

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
      if (err?.message?.includes("Authors cannot vote")) {
        console.warn(err.message);
        return;
      }
      console.error("Vote failed", err);
    }
  }

  const normalize = (s) => (s || "").replace(/^r\//i, "");

  const homePosts = posts;
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
