import { Eye, EyeOff, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginCustomer, registerCustomer } from "../services/api.js";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
};

const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const phoneIsValid = (phone) => /^\+?[0-9]{7,15}$/.test(phone.trim());

export default function AccountPage({ session, onSessionStart, onSessionEnd }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setShowPassword(false);
  };

  const validateForm = () => {
    if (!emailIsValid(form.email)) {
      return "Enter a valid email address, for example name@example.com.";
    }

    if (!form.password || form.password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (mode === "register") {
      if (!form.fullName.trim()) {
        return "Please enter your full name.";
      }

      if (!phoneIsValid(form.phone)) {
        return "Phone number must contain 7 to 15 digits and may start with +.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const sessionData =
        mode === "register"
          ? await registerCustomer({
              fullName: form.fullName.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              password: form.password,
            })
          : await loginCustomer({
              email: form.email.trim(),
              password: form.password,
            });

      if (sessionData.user.role !== "customer") {
        setErrorMessage(
          "This account uses the staff portal. Please sign in through the admin dashboard.",
        );
        return;
      }

      onSessionStart(sessionData);

      const returnPath = location.state?.from?.pathname || "/shop";
      navigate(returnPath, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Unable to continue with this account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--brand)]">
            <UserRound size={23} />
          </div>
          <p className="mt-6 text-sm font-bold tracking-[0.14em] text-[var(--accent)]">
            CUSTOMER ACCOUNT
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            Welcome, {session.user.full_name}
          </h1>
          <p className="mt-3 leading-7 text-[var(--text-muted)]">
            You are signed in and ready to keep your shopping bag connected to your account.
          </p>
          <button
            className="mt-7 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50"
            onClick={onSessionEnd}
            type="button"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </section>
      </main>
    );
  }

  const isRegistering = mode === "register";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-9">
        <p className="text-sm font-bold tracking-[0.14em] text-[var(--accent)]">
          CUSTOMER ACCOUNT
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
          {isRegistering ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 leading-7 text-[var(--text-muted)]">
          {isRegistering
            ? "Create an account to save your bag and place a sweater order."
            : "Sign in to continue with your saved shopping bag."}
        </p>

        <div className="mt-7 grid grid-cols-2 rounded-xl bg-[var(--surface-muted)] p-1">
          <button
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              !isRegistering
                ? "bg-[var(--surface)] text-[var(--brand)] shadow-sm"
                : "text-[var(--text-muted)]"
            }`}
            onClick={() => changeMode("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isRegistering
                ? "bg-[var(--surface)] text-[var(--brand)] shadow-sm"
                : "text-[var(--text-muted)]"
            }`}
            onClick={() => changeMode("register")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          {isRegistering && (
            <>
              <label className="block text-sm font-semibold text-[var(--text-main)]" htmlFor="fullName">
                Full name
                <input
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                  id="fullName"
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Your full name"
                  value={form.fullName}
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--text-main)]" htmlFor="phone">
                Phone number
                <input
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                  id="phone"
                  inputMode="tel"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+971501234567"
                  value={form.phone}
                />
              </label>
            </>
          )}

          <label className="block text-sm font-semibold text-[var(--text-main)]" htmlFor="email">
            Email address
            <input
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              id="email"
              inputMode="email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@example.com"
              value={form.email}
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--text-main)]" htmlFor="password">
            Password
            <span className="relative mt-2 block">
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                id="password"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="At least 6 characters"
                type={showPassword ? "text" : "password"}
                value={form.password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--text-muted)] transition hover:text-[var(--brand)]"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                type="button"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </label>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-[var(--brand)] px-5 py-3.5 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? isRegistering
                ? "Creating account..."
                : "Signing in..."
              : isRegistering
                ? "Create customer account"
                : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
