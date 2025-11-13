import { createContext, useContext, useEffect, useState } from "react";
import { uid, now } from "../utils/helpers";

const DataContext = createContext();

const INITIAL = {
  subreddits: [
    {
      id: "r/popular",
      name: "popular",
      description: "Popular across the site",
      theme: { color: "#ff4500" },
    },
    {
      id: "r/aww",
      name: "aww",
      description: "Cute things",
      theme: { color: "#00aaff" },
    },
    {
      id: "r/memes",
      name: "memes",
      description: "Fresh memes",
      theme: { color: "#8a2be2" },
    },
  ],
  posts: [
    {
      id: uid(),
      title: "Amazing movie: Inception",
      url: "https://www.imdb.com/title/tt1375666/",
      subreddit: "r/popular",
      author: "sys",
      votes: 24,
      voted: null,
      created_at: now(),
      type: "link",
    },
    {
      id: uid(),
      title: "Cute puppy meme",
      url: "https://i.imgur.com/puppy.jpg",
      subreddit: "r/aww",
      author: "sys",
      votes: 78,
      voted: null,
      created_at: now(),
      type: "image",
    },
  ],
  subscriptions: ["r/popular"],
};

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("reddit_clone_v1");
      return raw ? JSON.parse(raw) : INITIAL;
    } catch (e) {
      return INITIAL;
    }
  });

  useEffect(() => {
    localStorage.setItem("reddit_clone_v1", JSON.stringify(data));
  }, [data]);

  function createPost({ title, url, subreddit, type }) {
    const post = {
      id: uid(),
      title,
      url,
      subreddit,
      author: "anonymous",
      votes: 0,
      voted: null,
      created_at: now(),
      type,
    };
    setData((d) => ({ ...d, posts: [post, ...d.posts] }));
  }

  function vote(postId, dir) {
    setData((d) => ({
      ...d,
      posts: d.posts.map((p) => {
        if (p.id !== postId) return p;
        // toggle behavior
        const prev = p.voted;
        let votes = p.votes;
        if (prev === dir) {
          // undo
          votes += dir === "up" ? -1 : 1;
          return { ...p, votes, voted: null };
        }
        // if switching
        if (prev && prev !== dir) votes += dir === "up" ? 2 : -2;
        else votes += dir === "up" ? 1 : -1;
        return { ...p, votes, voted: dir };
      }),
    }));
  }

  function createSubreddit({ name, description, theme }) {
    const id = `r/${name}`;
    const subreddit = { id, name, description, theme };
    setData((d) => ({
      ...d,
      subreddits: [subreddit, ...d.subreddits],
      subscriptions: [...d.subscriptions, id],
    }));
  }

  function toggleSubscription(subId) {
    setData((d) => {
      const subs = d.subscriptions.includes(subId)
        ? d.subscriptions.filter((s) => s !== subId)
        : [...d.subscriptions, subId];
      return { ...d, subscriptions: subs };
    });
  }

  return (
    <DataContext.Provider
      value={{ ...data, createPost, vote, createSubreddit, toggleSubscription }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
