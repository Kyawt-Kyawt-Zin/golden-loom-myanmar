const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(result?.message || "Something went wrong");
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
    body: JSON.stringify(customer),
  });
};

export const loginCustomer = async ({ email, password }) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

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

export const getCatalogImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  const backendBaseUrl = API_BASE_URL.replace(/\/api$/, "");

  return `${backendBaseUrl}${imagePath}`;
};
