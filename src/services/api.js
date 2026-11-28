import {
  clearCustomerSession,
  readCustomerSession,
  saveCustomerSession,
} from "./customer-session.js";

const API_BASE_URL = "/api";

const getTokenUserId = (token) => {
  try {
    const payload = token
      .split(".")[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/");

    return JSON.parse(atob(payload)).userId;
  } catch {
    return null;
  }
};

const request = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };

  const authorization = headers.Authorization;
  const isAuthenticated = authorization?.startsWith("Bearer ");
  let sessionAtStart = null;

  if (isAuthenticated) {
    const suppliedToken = authorization.slice("Bearer ".length);
    sessionAtStart = readCustomerSession();

    if (
      !sessionAtStart ||
      String(getTokenUserId(suppliedToken)) !== String(sessionAtStart.user.id)
    ) {
      throw new Error("Please sign in again.");
    }

    // Use the latest token if another request has already renewed it.
    headers.Authorization = `Bearer ${sessionAtStart.token}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && sessionAtStart) {
    const renewedToken = await renewCustomerSession(
      sessionAtStart.token,
      sessionAtStart.user.id,
    );

    const latestSession = readCustomerSession();

    if (
      !renewedToken ||
      !latestSession ||
      String(latestSession.user.id) !== String(sessionAtStart.user.id)
    ) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${latestSession.token}`,
      },
    });
  }

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(result?.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return result?.data;
};

export const getCatalogProducts = async ({
  page = 1,
  limit = 12,
  search = "",
  gender = "",
} = {}) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  if (gender) {
    query.set("gender", gender);
  }

  return request(`/catalog/products?${query.toString()}`);
};

export const getCatalogProductBySlug = async (slug) => {
  return request(`/catalog/products/${encodeURIComponent(slug)}`);
};

export const registerCustomer = async (customer) => {
  return request("/auth/register", {
    method: "POST",
    headers: { "X-Customer-Session": "refresh" },
    body: JSON.stringify(customer),
  });
};

export const loginCustomer = async ({ email, password }) => {
  return request("/auth/login", {
    method: "POST",
    headers: { "X-Customer-Session": "refresh" },
    body: JSON.stringify({ email, password }),
  });
};

export const refreshCustomerSession = async () => {
  return request("/auth/refresh", {
    method: "POST",
  });
};

export const logoutCustomer = async () => {
  return request("/auth/logout", {
    method: "POST",
  });
};

let pendingCustomerRefresh = null;

export const renewCustomerSession = async (previousToken, userId) => {
  if (!navigator.locks) {
    throw new Error(
      "Automatic session renewal is unavailable in this browser.",
    );
  }

  if (pendingCustomerRefresh) {
    return pendingCustomerRefresh;
  }

  const renew = async () => {
    const current = readCustomerSession();

    if (!current || current.user.id !== userId) {
      return null;
    }

    // Another tab may already have renewed the session.
    if (current.token !== previousToken) {
      return current.token;
    }

    try {
      const renewed = await refreshCustomerSession();
      const latest = readCustomerSession();

      // Do not restore a session that was cleared or replaced.
      if (!latest || latest.user.id !== userId) {
        return null;
      }

      if (latest.token !== previousToken) {
        return latest.token;
      }

      saveCustomerSession({
        token: renewed.token,
        user: renewed.user,
      });

      return renewed.token;
    } catch (error) {
      const latest = readCustomerSession();

      if (
        error.status === 401 &&
        latest?.user.id === userId &&
        latest.token === previousToken
      ) {
        clearCustomerSession();
      }

      throw error;
    }
  };

  pendingCustomerRefresh = navigator.locks
    .request("golden-loom-customer-session", renew)
    .finally(() => {
      pendingCustomerRefresh = null;
    });

  return pendingCustomerRefresh;
};

export const updateMyProfile = async (token, profile) =>
  request("/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(profile),
  });

export const deleteMyAccount = async (token, password) =>
  request("/auth/me", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });

export const getMyCart = async (token) => {
  return request("/cart", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const addItemToCart = async (
  token,
  { productVariantId, quantity = 1 },
) => {
  return request("/cart/items", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productVariantId, quantity }),
  });
};

export const updateCartItemQuantity = async (token, cartItemId, quantity) => {
  return request(`/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });
};

export const removeCartItem = async (token, cartItemId) => {
  return request(`/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const clearMyCart = async (token) => {
  return request("/cart/items", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getDeliveryZones = async () => {
  return request("/delivery-zones");
};

export const checkoutMyCart = async (token, checkoutData) => {
  return request("/orders/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(checkoutData),
  });
};

export const getPendingPreorderDraft = (token) => request("/orders/checkout/preorder/draft", { headers: { Authorization: `Bearer ${token}` } });
export const getPreorderDraftStatus = (token, draftId) => request(`/orders/checkout/preorder/${draftId}`, { headers: { Authorization: `Bearer ${token}` } });
export const cancelPreorderDraft = (token, draftId) => request(`/orders/checkout/preorder/${draftId}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ acknowledgedNoTransfer: true }) });

export const preparePreorderCheckout = (token, checkoutData) => request("/orders/checkout/preorder/draft", {
  method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(checkoutData),
});

export const submitPreorderCheckoutReceipt = async (token, draftId, { transactionReference, paymentProof }) => {
  const current = await getPreorderDraftStatus(token, draftId);
  if (current.status === "completed") return current;
  const upload = await request(`/orders/checkout/preorder/${draftId}/upload`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ contentType: paymentProof.type }),
  });
  const form = new FormData();
  for (const [name, value] of Object.entries(upload.fields)) form.append(name, value);
  form.append("file", paymentProof);
  const response = await fetch(upload.uploadUrl, { method: "POST", body: form });
  if (!response.ok) throw new Error("Receipt upload failed. Please try again.");
  return request(`/orders/checkout/preorder/${draftId}/complete`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ transactionReference }),
  });
};

export const getMyOrders = async (token) => {
  return request("/orders/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getMyOrderById = async (token, orderId) => {
  return request(`/orders/my/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const schedulePickup = async (token, orderId, date, time) => {
  return request(`/orders/my/${orderId}/pickup`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date, time }),
  });
};

export const getMyOrderChangeRequests = async (token) =>
  request("/order-change-requests/my", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const requestOrderCancellation = async (
  token,
  orderId,
  customerNote,
  acceptDepositForfeit,
) =>
  request("/order-change-requests", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      orderId: Number(orderId),
      requestType: "cancel_order",
      customerNote,
      acceptDepositForfeit,
    }),
  });

export const requestVariantChange = async (
  token,
  orderId,
  orderItemId,
  requestedVariantId,
) =>
  request("/order-change-requests", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      orderId: Number(orderId),
      orderItemId: Number(orderItemId),
      requestedVariantId: Number(requestedVariantId),
      requestType: "change_variant",
    }),
  });

export const getActiveBankAccounts = async () => {
  return request("/bank-accounts");
};

export const submitDepositPaymentProof = async (
  token,
  paymentId,
  { transactionReference, paymentProof },
) => {
  const formData = new FormData();

  formData.append("transactionReference", transactionReference);
  formData.append("paymentProof", paymentProof);

  return request(`/payments/${paymentId}/proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
};

export const submitDepositPaymentProofToS3 = async (
  token,
  paymentId,
  { transactionReference, paymentProof },
) => {
  // 1. Ask the backend for a temporary upload form.
  const upload = await request(`/payments/${paymentId}/proof/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType: paymentProof.type,
    }),
  });

  // 2. Send the file directly to S3 using the temporary form fields.
  const formData = new FormData();

  for (const [name, value] of Object.entries(upload.fields)) {
    formData.append(name, value);
  }

  // S3 requires the file field to be added after the signed fields.
  formData.append("file", paymentProof);

  const s3Response = await fetch(upload.uploadUrl, {
    method: "POST",
    body: formData,
    credentials: "omit",
  });

  if (!s3Response.ok) {
    throw new Error("Unable to upload the screenshot. Please try again.");
  }

  // 3. Ask the backend to validate and submit the uploaded receipt.
  return request(`/payments/${paymentId}/proof/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      uploadId: upload.uploadId,
      transactionReference,
    }),
  });
};

export const getCatalogImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // A complete S3 viewing URL can be used as it is.
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  // Existing local paths still need the backend address.
  const backendBaseUrl = API_BASE_URL.replace(/\/api$/, "");

  return `${backendBaseUrl}${imagePath}`;
};
