import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());

  const loadSaved = useCallback(async () => {
    try {
      const saved = await api.savedPosts();
      setSavedIds(new Set(saved.map((p) => String(p.id))));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  // Rehydrate session from a stored token on first load.
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!tokenStore.get()) { setReady(true); return; }
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me);
        await loadSaved();
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [loadSaved]);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(u);
    await loadSaved();
    return u;
  }, [loadSaved]);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await api.register(payload);
    tokenStore.set(token);
    setUser(u);
    await loadSaved();
    return u;
  }, [loadSaved]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setSavedIds(new Set());
  }, []);

  // Optimistic save toggle, reconciled with the server response.
  const toggleSaved = useCallback(async (id) => {
    const key = String(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    try {
      const res = await api.toggleSave(id);
      if (res && Array.isArray(res.savedPosts)) {
        setSavedIds(new Set(res.savedPosts.map((p) => String(p))));
      }
    } catch {
      // Roll back on failure.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      user, loggedIn: !!user, ready, savedIds,
      login, register, logout, setUser, toggleSaved, refreshSaved: loadSaved,
      isSaved: (id) => savedIds.has(String(id)),
    }),
    [user, ready, savedIds, login, register, logout, toggleSaved, loadSaved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
