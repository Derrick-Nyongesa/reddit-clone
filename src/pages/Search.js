import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import PostCard from "../components/PostCard";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// robust createdAt -> timestamp (ms) helper
function createdAtMillis(createdAt) {
  if (!createdAt) return 0;
  // Firestore Timestamp with toDate
  if (createdAt.toDate && typeof createdAt.toDate === "function") {
    return createdAt.toDate().getTime();
  }
  // Server might be ISO string (we used optimistic local ISO strings too)
  if (typeof createdAt === "string") return new Date(createdAt).getTime();
  // Firestore Timestamp object with seconds property
  if (createdAt.seconds) return createdAt.seconds * 1000;
  // fallback: try Date
  const parsed = new Date(createdAt);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function Search() {
  const queryParams = useQuery();
  const navigate = useNavigate();
  const { posts, subreddits, loading } = useData();

  // read q param
  const qParam = queryParams.get("q") || "";
  const [term, setTerm] = useState(qParam);
  const [subFilter, setSubFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest"); // newest | oldest | top

  // sync term when URL changes (for back/forward)
  useEffect(() => {
    setTerm(qParam);
  }, [qParam]);

  // when user types in this page, update the url param
  useEffect(() => {
    const params = new URLSearchParams();
    if (term && term.trim().length > 0) params.set("q", term.trim());
    if (subFilter && subFilter !== "all") params.set("sub", subFilter);
    if (sortMode) params.set("sort", sortMode);
    navigate(
      { pathname: "/search", search: params.toString() },
      { replace: true }
    );
  }, [term, subFilter, sortMode]);

  // compute filtered results (memoized)
  const results = useMemo(() => {
    const q = (term || "").trim().toLowerCase();
    const subSel = subFilter === "all" ? null : subFilter;

    const filtered = posts.filter((p) => {
      // if subreddit filter applied
      if (subSel && p.subreddit !== subSel) return false;

      if (!q) return true; // no search term -> include (will be sorted)

      const sub = subreddits.find((s) => s.id === p.subreddit) || {};
      // create a searchable haystack from relevant fields
      const hay = `${p.title || ""} ${p.text || ""} ${p.url || ""} ${
        p.author || ""
      } ${p.subreddit || ""} ${sub.name || ""}`.toLowerCase();
      return hay.includes(q);
    });

    // sort
    const sorted = filtered.slice(); // copy
    if (sortMode === "newest") {
      sorted.sort(
        (a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt)
      );
    } else if (sortMode === "oldest") {
      sorted.sort(
        (a, b) => createdAtMillis(a.createdAt) - createdAtMillis(b.createdAt)
      );
    } else if (sortMode === "top") {
      sorted.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    return sorted;
  }, [posts, subreddits, term, subFilter, sortMode]);

  const subredditOptions = useMemo(() => {
    return [{ id: "all", name: "All subreddits" }, ...subreddits];
  }, [subreddits]);

  return (
    <div>
      <h2>Search</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* <input
            className="input"
            placeholder="Search posts, authors or subreddits..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          /> */}

          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="input"
            style={{ minWidth: 180 }}
          >
            {subredditOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || `r/${s.id}`}
              </option>
            ))}
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="input"
            style={{ minWidth: 140 }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="top">Top (votes)</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {loading ? (
          <div className="card">Loading posts…</div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <strong>{results.length}</strong> result
              {results.length !== 1 ? "s" : ""}{" "}
              {term ? <>for “{term}”</> : "found"}
            </div>

            {results.length === 0 ? (
              <div className="card">
                {term ? (
                  <>No posts matched your search. Try different keywords.</>
                ) : (
                  <>No posts found.</>
                )}
              </div>
            ) : (
              results.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
