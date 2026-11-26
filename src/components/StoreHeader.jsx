import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
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

export default function StoreHeader({
  cartItemCount = 0,
  session,
  theme,
  onToggleTheme,
}) {
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
            to="/account"
            className={({ isActive }) =>
              `inline-flex h-10 items-center justify-center gap-2 rounded-full border px-3 text-[var(--brand)] transition hover:border-[var(--accent)] ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`
            }
            aria-label={
              session ? "Open your account" : "Sign in or create an account"
            }
            title={session ? "Your account" : "Sign in"}
          >
            <UserRound size={18} />
            <span className="hidden text-sm font-semibold sm:inline">
              {session ? session.user.full_name.split(" ")[0] : "Sign in"}
            </span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `relative inline-flex h-10 w-10 items-center justify-center rounded-full border text-[var(--brand)] transition hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`
            }
            aria-label={
              cartItemCount > 0
                ? `Open shopping cart with ${cartItemCount} item${
                    cartItemCount === 1 ? "" : "s"
                  }`
                : "Open shopping cart"
            }
            title={
              cartItemCount > 0
                ? `Shopping cart: ${cartItemCount} item${
                    cartItemCount === 1 ? "" : "s"
                  }`
                : "Shopping cart"
            }
          >
            <ShoppingBag size={19} />

            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--surface)] bg-[var(--accent)] px-1 text-[10px] font-extrabold text-[#00382f] shadow-sm">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
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
