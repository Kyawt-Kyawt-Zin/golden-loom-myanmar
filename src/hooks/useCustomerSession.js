import { useState } from "react";

const storageKey = "golden-loom-customer-session";

const readStoredSession = () => {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return null;
    }

    const session = JSON.parse(storedValue);

    if (!session?.token || !session?.user) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

export default function useCustomerSession() {
  const [session, setSession] = useState(readStoredSession);

  const startSession = (sessionData) => {
    const nextSession = {
      token: sessionData.token,
      user: sessionData.user,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const endSession = () => {
    window.localStorage.removeItem(storageKey);
    setSession(null);
  };

  return {
    session,
    startSession,
    endSession,
  };
}
