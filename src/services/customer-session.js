const storageKey = "golden-loom-customer-session";

export const readCustomerSession = () => {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return null;

    const session = JSON.parse(value);
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
};

export const saveCustomerSession = (session) => {
  localStorage.setItem(storageKey, JSON.stringify(session));
  window.dispatchEvent(new Event("customer-session-changed"));
};

export const clearCustomerSession = () => {
  localStorage.removeItem(storageKey);
  window.dispatchEvent(new Event("customer-session-changed"));
};
