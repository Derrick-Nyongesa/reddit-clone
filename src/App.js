import { Routes, Route, Link, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Subreddit from "./pages/Subreddit";
import CreatePost from "./pages/CreatePost";
import NewSubreddit from "./pages/NewSubreddit";
import Profile from "./pages/Profile";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Authentication from "./pages/Authentication";
import Search from "./pages/Search";
import PrivateRoute from "./PrivateRoute";

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
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/r/:subredditId"
          element={
            <PrivateRoute>
              <Subreddit />
            </PrivateRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreatePost />
            </PrivateRoute>
          }
        />
        <Route
          path="/new-subreddit"
          element={
            <PrivateRoute>
              <NewSubreddit />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <Search />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
