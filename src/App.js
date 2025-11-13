import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Subreddit from "./pages/Subreddit";
import CreatePost from "./pages/CreatePost";
import NewSubreddit from "./pages/NewSubreddit";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div>
      <Header />
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/r/:subredditId" element={<Subreddit />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/new-subreddit" element={<NewSubreddit />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <aside className="card">
          <h4>Your Subscriptions</h4>
          <div style={{ marginTop: 8 }}>
            <Link to="/new-subreddit" className="link-btn">
              Create Subreddit
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
