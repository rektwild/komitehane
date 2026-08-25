"use client";

import {useEffect, useLayoutEffect} from "react";

const themeInitializationScript = `
(function () {
  var root = document.documentElement;

  try {
    var storedTheme = window.localStorage.getItem("komitehane-theme");
    var isDark = storedTheme === "dark";

    if (storedTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
})();
`;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function applyStoredTheme() {
  const root = document.documentElement;

  try {
    const storedTheme = window.localStorage.getItem("komitehane-theme");
    let isDark = storedTheme === "dark";

    if (storedTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

type ThemeInitializerScriptProps = {
  locale: string;
};

export function ThemeInitializerScript({
  locale,
}: ThemeInitializerScriptProps) {
  useIsomorphicLayoutEffect(() => {
    applyStoredTheme();
  }, [locale]);

  return (
    <script
      id="theme-initializer"
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{__html: themeInitializationScript}}
    />
  );
}
