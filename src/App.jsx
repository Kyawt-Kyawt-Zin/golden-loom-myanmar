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
import ContactPage from "./pages/ContactPage.jsx";

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">GOLDEN LOOM MYANMAR</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--brand)]">Made in Myanmar, chosen for Dubai</h1>
        <p className="mt-4 leading-7 text-[var(--text-muted)]">Shop sweaters available in Dubai or choose a design to preorder from Myanmar.</p>
        <h2 className="mt-10 text-2xl font-bold text-[var(--brand)]">How preorder works</h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 leading-7 text-[var(--text-main)]">
          <li>Choose a preorder sweater, colour and size. The product page shows the estimated lead time.</li>
          <li>Place your order and choose delivery or pickup. Your preorder items and any in-stock items are handled as separate orders.</li>
          <li>Pay a 20% deposit on the preorder items by bank transfer, then submit your payment screenshot and transaction reference.</li>
          <li>Your receipt will be reviewed. After the deposit is confirmed, your preorder can be processed.</li>
          <li>Pay the remaining balance using your selected payment method when your order is ready for delivery or pickup. Any delivery fee is included in the order total.</li>
        </ol>
        <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">Lead times are estimates. You can follow your order from your account.</p>
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

          <Route path="/about" element={<AboutPage />} />

          <Route path="/contact" element={<ContactPage />} />

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
