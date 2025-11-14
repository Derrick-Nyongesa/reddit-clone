import { Routes, Route, Link, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Subreddit from "./pages/Subreddit";
import CreatePost from "./pages/CreatePost";
import NewSubreddit from "./pages/NewSubreddit";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Authentication from "./pages/Authentication";

// ---- LAYOUTS ----
function MainLayout() {
  return (
    <div>
      <Header />
      <div className="app">
        <Sidebar />

        <main className="main">
          <Outlet />
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

function AuthLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* No header, no sidebar, no main class */}
      <Outlet />
    </div>
  );
}

// ---- APP ----
function App() {
  return (
    <Routes>
      {/* Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth" element={<Authentication />} />
      </Route>

      {/* Default Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/r/:subredditId" element={<Subreddit />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/new-subreddit" element={<NewSubreddit />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
