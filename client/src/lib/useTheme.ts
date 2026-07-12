import { useCallback, useState } from "react";
import { getInitialTheme, setTheme, type Theme } from "./theme";

export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setTheme(next);
      return next;
    });
  }, []);

  return [theme, toggle];
}
