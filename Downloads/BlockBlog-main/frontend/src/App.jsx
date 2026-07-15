import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Forgot from './pages/Forgot';
import PostCreate from './pages/PostCreate';
import PostDetail from './pages/PostDetail';
import Account from './pages/Account';
import Saved from './pages/Saved';
import About from './pages/About';

const withLayout = (el) => <Layout>{el}</Layout>;

function AppRoutes() {
  const { ready } = useAuth();
  // Avoid a flash of the logged-out UI while the stored session rehydrates.
  if (!ready) return null;

  return (
    <Routes>
      {/* Auth screens — no page chrome */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<Forgot />} />

      {/* Chrome routes. Static paths are declared before the dynamic /:id. */}
      <Route path="/" element={withLayout(<Landing />)} />
      <Route path="/about-us" element={withLayout(<About />)} />
      <Route path="/post" element={<RequireAuth>{withLayout(<PostCreate />)}</RequireAuth>} />
      <Route path="/edit/:id" element={<RequireAuth>{withLayout(<PostCreate />)}</RequireAuth>} />
      <Route path="/user" element={<RequireAuth>{withLayout(<Account />)}</RequireAuth>} />
      <Route path="/saved-post" element={<RequireAuth>{withLayout(<Saved />)}</RequireAuth>} />

      {/* Dynamic post detail — /{postingan} */}
      <Route path="/:id" element={withLayout(<PostDetail />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
