"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * The admin panel's own light/dark setting, kept apart from the site's.
 *
 * A customer switching the public site to dark shouldn't repaint the back
 * office, and someone working in the panel all day may want the opposite of
 * whatever the site is set to. This pins a theme on the panel's own subtree via
 * `.theme-light` / `.theme-dark`, so the `.dark` class on <html> — which
 * next-themes owns — doesn't reach it.
 */

const STORAGE_KEY = "24x7-admin-theme";

type AdminTheme = "light" | "dark";

const AdminThemeContext = createContext<{ theme: AdminTheme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

/** localStorage as the store: it survives reloads and other admin tabs. */
const CHANGED = "24x7-admin-theme-changed";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(): AdminTheme {
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Light on the server, and again on the client until the stored choice is
  // read — the panel is a light surface by default, and starting there avoids a
  // dark flash for everyone who never changes it.
  const theme = useSyncExternalStore<AdminTheme>(subscribe, read, () => "light");

  const toggle = useCallback(() => {
    const next = read() === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div className={theme === "dark" ? "theme-dark" : "theme-light"}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function AdminThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useContext(AdminThemeContext);
  const dark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch the admin panel to light" : "Switch the admin panel to dark"}
      title="Admin panel theme"
      className={className}
    >
      {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
