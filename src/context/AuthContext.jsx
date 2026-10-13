import { createContext, useContext, useState, useCallback } from 'react';

const KEY = 'mamoon-session';
const Ctx = createContext(null);

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(read);
  const login = useCallback((s) => {
    const value = s.role === 'parent' ? { ...s, kidId: s.kidIds[0] } : s;
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* bỏ qua */ }
    setSession(value);
  }, []);
  const logout = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
    setSession(null);
  }, []);
  return <Ctx.Provider value={{ session, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
