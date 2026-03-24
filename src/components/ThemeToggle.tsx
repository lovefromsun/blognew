"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getAutoThemeFromLocalTime } from "@/lib/theme-schedule";

const STORAGE_KEY = "theme";

type ThemeMode = "light" | "dark";

function getSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
}

function getServerSnapshot(): ThemeMode {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => onStoreChange();
  window.addEventListener("themechange", handler);
  return () => window.removeEventListener("themechange", handler);
}

function applyTheme(mode: ThemeMode, persist: boolean) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  root.dataset.theme = mode;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new Event("themechange"));
}

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    applyTheme(next, true);
  }, [mode]);

  // 未手动固定时：跨时段（如从夜间到白天）自动跟随本机时间
  useEffect(() => {
    function tick() {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
        const auto = getAutoThemeFromLocalTime();
        const cur = document.documentElement.classList.contains("light")
          ? "light"
          : "dark";
        if (cur !== auto) {
          applyTheme(auto, false);
        }
      } catch {
        /* ignore */
      }
    }
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
      aria-label={mode === "dark" ? "切换到白天模式" : "切换到夜间模式"}
      title={mode === "dark" ? "切换为浅色（会记住选择）" : "切换为深色（会记住选择）"}
    >
      {mode === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}

function IconSun() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
