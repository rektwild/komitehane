"use client";

import {useTranslations} from "next-intl";
import {useEffect, useSyncExternalStore} from "react";

import {ThemeSwitcher} from "@/components/kibo-ui/theme-switcher";

const THEME_STORAGE_KEY = "komitehane-theme";
const themes = ["system", "light", "dark"] as const;

type Theme = (typeof themes)[number];

function isTheme(value: string | null): value is Theme {
  return value !== null && themes.includes(value as Theme);
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

const themeListeners = new Set<() => void>();

function getStoredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isTheme(storedTheme) ? storedTheme : "light";
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getClientTheme() {
  return getStoredTheme();
}

function getServerTheme(): Theme {
  return "light";
}

export function FooterThemeSwitcher() {
  const t = useTranslations("ThemeSwitcher");
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getClientTheme,
    getServerTheme,
  );

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  function handleThemeChange(nextTheme: Theme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    themeListeners.forEach((listener) => listener());
    applyTheme(nextTheme);
  }

  return (
    <ThemeSwitcher
      value={theme}
      onChange={handleThemeChange}
      defaultValue="light"
      labels={{
        group: t("label"),
        system: t("system"),
        light: t("light"),
        dark: t("dark"),
      }}
    />
  );
}
