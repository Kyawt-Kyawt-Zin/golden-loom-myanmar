import { useCallback, useEffect, useState } from "react";
import {
  clearCustomerSession,
  readCustomerSession,
  saveCustomerSession,
} from "../services/customer-session.js";

export default function useCustomerSession() {
  const [session, setSession] = useState(readCustomerSession);

  useEffect(() => {
    const syncSession = () => setSession(readCustomerSession());

    window.addEventListener("customer-session-changed", syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("customer-session-changed", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const startSession = useCallback((sessionData) => {
    saveCustomerSession({
      token: sessionData.token,
      user: sessionData.user,
    });
  }, []);

  const endSession = useCallback(() => {
    clearCustomerSession();
  }, []);

  return {
    session,
    startSession,
    endSession,
  };
}
