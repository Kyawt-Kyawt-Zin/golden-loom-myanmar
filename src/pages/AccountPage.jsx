import { Eye, EyeOff, LogOut, Package, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteMyAccount,
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  updateMyProfile,
} from "../services/api.js";
import { readCustomerSession } from "../services/customer-session.js";

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const beginProfileEdit = () => {
    setProfileForm({ fullName: session.user.full_name || "", phone: session.user.phone || "" });
    setProfileError("");
    setProfileMessage("");
    setEditingProfile(true);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const fullName = profileForm.fullName.trim();
    const phone = profileForm.phone.trim();
    if (!fullName || fullName.length > 100) {
      setProfileError("Enter a name of 1 to 100 characters.");
      return;
    }
    if (phone && !phoneIsValid(phone)) {
      setProfileError("Phone number must contain 7 to 15 digits and may start with +.");
      return;
    }
    setProfileSaving(true);
    setProfileError("");
    try {
      const user = await updateMyProfile(session.token, { fullName, phone });
      const latest = readCustomerSession();
      // Do not restore a session if the customer signed out while saving.
      if (latest && String(latest.user.id) === String(user.id)) {
        onSessionStart({ ...latest, user });
        setProfileMessage("Your profile has been updated.");
        setEditingProfile(false);
      }
    } catch (error) {
      setProfileError(error.message || "Unable to update your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutError("");
    setSigningOut(true);

    const signOut = async () => {
      await logoutCustomer();
      onSessionEnd();
    };

    try {
      if (navigator.locks) {
        await navigator.locks.request("golden-loom-customer-session", signOut);
      } else {
        await signOut();
      }
    } catch {
      setSignOutError(
        "Unable to sign out. Please check your connection and try again.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (!deleteAcknowledged || !deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteMyAccount(session.token, deletePassword);
      setDeletePassword("");
      setDeleted(true);
      onSessionEnd();
    } catch (error) {
      setDeleteError(error.message || "Unable to delete your account.");
    } finally {
      setDeleting(false);
    }
  };

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
          "This account uses the admin dashboard. Please sign in there.",
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
            CUSTOMER ACCOUNT
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            Welcome, {session.user.full_name}
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Manage your profile, orders, and preorder payments.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--brand)]">
              <UserRound size={21} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--brand)]">
              Profile
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {session.user.email}
              {session.user.phone ? ` · ${session.user.phone}` : ""}
            </p>

            {profileMessage && <p role="status" className="mt-4 text-sm font-semibold text-[var(--brand)]">{profileMessage}</p>}
            {editingProfile ? (
              <form onSubmit={handleProfileSave} className="mt-5 space-y-4" aria-label="Edit profile">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Full name
                  <input className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text-main)]" autoComplete="name" maxLength={100} required value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
                </label>
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Phone number <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                  <input className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text-main)]" autoComplete="tel" inputMode="tel" maxLength={16} value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <p className="text-sm text-[var(--text-muted)]">To change your email address, please contact us.</p>
                {profileError && <p role="alert" className="text-sm text-[var(--danger)]">{profileError}</p>}
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={profileSaving} className="rounded-xl bg-[var(--brand)] px-4 py-2 font-semibold text-[var(--on-brand)] disabled:opacity-60">{profileSaving ? "Saving…" : "Save changes"}</button>
                  <button type="button" disabled={profileSaving} onClick={() => { setEditingProfile(false); setProfileError(""); }} className="rounded-xl border border-[var(--border)] px-4 py-2 font-semibold text-[var(--text-main)] disabled:opacity-60">Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={beginProfileEdit} className="mt-5 block text-sm font-semibold text-[var(--brand)] underline">Edit profile</button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="mt-5 text-sm font-semibold text-rose-700 underline"
            >
              Delete account
            </button>
            {showDeleteConfirmation && (
              <form
                onSubmit={handleDeleteAccount}
                className="mt-4 space-y-3 rounded-xl border border-rose-200 p-4"
                aria-label="Confirm account deletion"
              >
                <h3 className="font-bold text-rose-700">
                  Delete your account?
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Your profile will be signed out and can't register with the
                  same email again. If you have an active order, contact the
                  shop first; deletion is unavailable until it is complete or
                  cancelled.
                </p>
                <label className="block text-sm">
                  Your password
                  <input
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                  />
                </label>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={deleteAcknowledged}
                    onChange={(event) =>
                      setDeleteAcknowledged(event.target.checked)
                    }
                  />
                  I understand the consequences and want to delete my account.
                </label>
                {deleteError && (
                  <p role="alert" className="text-sm text-rose-700">
                    {deleteError}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={deleting}
                    className="rounded-xl bg-rose-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Confirm deletion"}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setDeletePassword("");
                      setDeleteError("");
                      setDeleteAcknowledged(false);
                    }}
                    className="rounded-xl border border-[var(--border)] px-4 py-2"
                  >
                    Keep my account
                  </button>
                </div>
              </form>
            )}
          </section>

          <button
            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
            onClick={() => navigate("/account/orders")}
            type="button"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--brand)]">
              <Package size={21} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--brand)]">
              My orders
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Track delivery progress, check payment status, and submit a
              preorder deposit receipt.
            </p>

            <span className="mt-5 inline-flex text-sm font-semibold text-[var(--brand)]">
              View my orders →
            </span>
          </button>
        </div>

        {signOutError && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            {signOutError}
          </p>
        )}

        <button
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:opacity-80 disabled:opacity-60"
          onClick={handleSignOut}
          disabled={signingOut}
          type="button"
        >
          <LogOut size={18} />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </main>
    );
  }

  const isRegistering = mode === "register";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-9">
        {deleted && (
          <p
            role="status"
            className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            Your profile was deleted and you have been signed out.
          </p>
        )}
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
              <label
                className="block text-sm font-semibold text-[var(--text-main)]"
                htmlFor="fullName"
              >
                Full name
                <input
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                  id="fullName"
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="Your full name"
                  value={form.fullName}
                />
              </label>

              <label
                className="block text-sm font-semibold text-[var(--text-main)]"
                htmlFor="phone"
              >
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

          <label
            className="block text-sm font-semibold text-[var(--text-main)]"
            htmlFor="email"
          >
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

          <label
            className="block text-sm font-semibold text-[var(--text-main)]"
            htmlFor="password"
          >
            Password
            <span className="relative mt-2 block">
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                id="password"
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
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
