import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onToggleTheme }) {
  const isDarkMode = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--brand)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 sm:h-10 sm:w-10"
      aria-label={isDarkMode ? "Switch to day mode" : "Switch to night mode"}
      title={isDarkMode ? "Switch to day mode" : "Switch to night mode"}
    >
      {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
