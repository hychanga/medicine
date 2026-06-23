"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function useTheme() {
  return useContext(Ctx);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // initialise from the class that the anti-FOUC script already set
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}
