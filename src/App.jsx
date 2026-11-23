import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getMyCart } from "./services/api.js";
import StoreFooter from "./components/StoreFooter.jsx";
import StoreHeader from "./components/StoreHeader.jsx";
import useCustomerSession from "./hooks/useCustomerSession.js";
import AccountPage from "./pages/AccountPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import CustomerOrderDetailPage from "./pages/CustomerOrderDetailsPage.jsx";
import useTheme from "./hooks/useTheme.js";
import HomePage from "./pages/HomePage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";

function StorePlaceholderPage({ eyebrow, title, description }) {
  return (
    <main className="mx-auto flex max-w-7xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-3xl font-bold text-[var(--brand)]">{title}</h1>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--text-muted)]">
          {description}
        </p>
      </section>
    </main>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const { session, startSession, endSession } = useCustomerSession();
  const [cartItemCount, setCartItemCount] = useState(0);

  const refreshCartItemCount = useCallback(async () => {
    if (!session) {
      setCartItemCount(0);
      return;
    }

    try {
      const cartData = await getMyCart(session.token);

      setCartItemCount(cartData.summary.total_quantity);
    } catch {
      setCartItemCount(0);
    }
  }, [session]);

  useEffect(() => {
    refreshCartItemCount();
  }, [refreshCartItemCount]);

  const handleCartChanged = useCallback((updatedCart) => {
    setCartItemCount(updatedCart?.summary?.total_quantity || 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--page-bg)] text-[var(--text-main)]">
      <StoreHeader
        cartItemCount={cartItemCount}
        session={session}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/shop" element={<ShopPage />} />

          <Route
            path="/shop/:slug"
            element={
              <ProductDetailPage
                onCartChanged={handleCartChanged}
                session={session}
              />
            }
          />

          <Route
            path="/account"
            element={
              <AccountPage
                onSessionEnd={endSession}
                onSessionStart={startSession}
                session={session}
              />
            }
          />

          <Route
            path="/account/orders"
            element={<MyOrdersPage session={session} />}
          />

          <Route
            path="/account/orders/:orderId"
            element={<CustomerOrderDetailPage session={session} />}
          />

          <Route
            path="/about"
            element={
              <StorePlaceholderPage
                eyebrow="OUR STORY"
                title="Made in Myanmar, chosen for Dubai"
                description="This page will introduce Golden Loom Myanmar, the people and craft behind the sweaters, and how our preorder process works."
              />
            }
          />

          <Route
            path="/contact"
            element={
              <StorePlaceholderPage
                eyebrow="GET IN TOUCH"
                title="Contact Golden Loom Myanmar"
                description="This page will later contain your customer contact options, service information, and Dubai delivery support."
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage onCartChanged={handleCartChanged} session={session} />
            }
          />

          <Route
            path="/checkout"
            element={
              <CheckoutPage
                onCartChanged={handleCartChanged}
                session={session}
              />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <StoreFooter />
    </div>
  );
}

export default App;
