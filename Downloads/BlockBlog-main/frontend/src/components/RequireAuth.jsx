import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Gate for authenticated-only routes. Sends guests to /login and remembers
// where they were headed so the flow can return there after sign-in.
export default function RequireAuth({ children }) {
  const { loggedIn, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!loggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
