import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import goldenLoomEmblem from "../assets/golden-loom-emblem.png";
import ThemeToggle from "./ThemeToggle.jsx";

const navigationLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const navigationClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-[var(--accent-soft)] text-[var(--brand)]"
      : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand)]"
  }`;

export default function StoreHeader({ theme, onToggleTheme }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--page-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          onClick={closeMobileMenu}
          className="flex min-w-0 items-center gap-3"
          aria-label="Golden Loom Myanmar home"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--accent)] bg-[var(--surface-muted)]">
            <img
              src={goldenLoomEmblem}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-wide text-[var(--brand)]">
              GOLDEN LOOM
            </span>
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              Myanmar
            </span>
          </span>
        </NavLink>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navigationLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navigationClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

          <NavLink
            to="/cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-white transition hover:bg-[var(--brand-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            aria-label="Open shopping cart"
            title="Shopping cart"
          >
            <ShoppingBag size={19} />
          </NavLink>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--brand)] transition hover:border-[var(--accent)] md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={navigationClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
