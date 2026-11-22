import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  clearMyCart,
  getMyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/api.js";

const emptyCartData = {
  cart: null,
  items: [],
  summary: {
    unique_items: 0,
    total_quantity: 0,
    subtotal: 0,
  },
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatText = (value) => {
  return value ? value.replaceAll("_", " ") : "—";
};

const isUnavailable = (item) => {
  if (!Boolean(item.variant_is_active) || !Boolean(item.product_is_active)) {
    return true;
  }

  return (
    item.fulfillment_type === "in_stock" &&
    Number(item.stock_quantity) < Number(item.quantity)
  );
};

export default function CartPage({ session, onCartChanged }) {
  const [cartData, setCartData] = useState(emptyCartData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  const loadCart = useCallback(async () => {
    if (!session) {
      setCartData(emptyCartData);
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const data = await getMyCart(session.token);
      setCartData(data);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load your cart.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const preorderDepositTotal = useMemo(() => {
    return cartData.items.reduce((total, item) => {
      if (item.fulfillment_type !== "preorder") {
        return total;
      }

      return (
        total +
        (Number(item.price) *
          Number(item.quantity) *
          Number(item.deposit_percentage)) /
          100
      );
    }, 0);
  }, [cartData.items]);

  const hasUnavailableItem = cartData.items.some(isUnavailable);

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      setUpdatingItemId(item.cart_item_id);

      const updatedCart = await updateCartItemQuantity(
        session.token,
        item.cart_item_id,
        nextQuantity,
      );

      setCartData(updatedCart);
      onCartChanged?.(updatedCart);
    } catch (error) {
      setErrorMessage(error.message || "Unable to update item quantity.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDecrease = (item) => {
    if (Number(item.quantity) === 1) {
      handleRemoveItem(item);
      return;
    }

    handleQuantityChange(item, Number(item.quantity) - 1);
  };

  const handleRemoveItem = async (item) => {
    const confirmed = window.confirm(
      `Remove ${item.product_name} (${item.color} · ${item.size}) from your cart?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      setUpdatingItemId(item.cart_item_id);

      const updatedCart = await removeCartItem(
        session.token,
        item.cart_item_id,
      );

      setCartData(updatedCart);
      onCartChanged?.(updatedCart);
      setMessage(`${item.product_name} was removed from your cart.`);
    } catch (error) {
      setErrorMessage(error.message || "Unable to remove this item.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    const confirmed = window.confirm(
      "Clear every item from your shopping cart?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setMessage("");
      setIsClearing(true);

      const updatedCart = await clearMyCart(session.token);

      setCartData(updatedCart);
      onCartChanged?.(updatedCart);
      setMessage("Your cart was cleared.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to clear your cart.");
    } finally {
      setIsClearing(false);
    }
  };

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-12">
          <ShoppingBag
            aria-hidden="true"
            className="mx-auto text-[var(--accent)]"
            size={34}
          />

          <p className="mt-5 text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
            YOUR SHOPPING BAG
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[var(--brand)]">
            Sign in to view your cart
          </h1>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--text-muted)]">
            Your cart is safely linked to your customer account.
          </p>

          <Link
            className="mt-7 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            to="/account"
          >
            Sign in or create an account
          </Link>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
            YOUR SHOPPING BAG
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            Your cart
          </h1>

          <p className="mt-3 text-[var(--text-muted)]">
            Review your selected sweaters before checkout.
          </p>
        </div>

        {cartData.items.length > 0 && (
          <button
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            disabled={isClearing}
            onClick={handleClearCart}
            type="button"
          >
            <Trash2 size={17} />
            {isClearing ? "Clearing..." : "Clear cart"}
          </button>
        )}
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </p>
      )}

      {cartData.items.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-12">
          <ShoppingBag
            aria-hidden="true"
            className="mx-auto text-[var(--accent)]"
            size={34}
          />

          <h2 className="mt-5 text-2xl font-bold text-[var(--brand)]">
            Your cart is empty
          </h2>

          <p className="mt-3 text-[var(--text-muted)]">
            Browse our sweater collection and choose your favourite style.
          </p>

          <Link
            className="mt-7 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            to="/shop"
          >
            Shop sweaters
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4">
            {cartData.items.map((item) => {
              const unavailable = isUnavailable(item);
              const isUpdating = updatingItemId === item.cart_item_id;
              const cannotIncrease =
                item.fulfillment_type === "in_stock" &&
                Number(item.quantity) >= Number(item.stock_quantity);

              return (
                <article
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
                  key={item.cart_item_id}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--accent)]">
                        {item.category_name}
                      </p>

                      <Link
                        className="mt-1 block text-lg font-bold text-[var(--brand)] hover:text-[var(--accent)]"
                        to={`/shop/${item.product_slug}`}
                      >
                        {item.product_name}
                      </Link>

                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {item.color} · {item.size} · {item.sku}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold capitalize text-[var(--text-main)]">
                          {formatText(item.fulfillment_type)}
                        </span>

                        {item.fulfillment_type === "in_stock" && (
                          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">
                            {item.stock_quantity} available
                          </span>
                        )}
                      </div>

                      {unavailable && (
                        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                          This option is no longer available in the requested
                          quantity. Remove it before checkout.
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                      <p className="text-lg font-bold text-[var(--brand)]">
                        {formatMoney(item.line_total)}
                      </p>

                      <p className="text-sm text-[var(--text-muted)]">
                        {formatMoney(item.price)} each
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          aria-label={`Decrease ${item.product_name} quantity`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--brand)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={isUpdating}
                          onClick={() => handleDecrease(item)}
                          type="button"
                        >
                          <Minus size={16} />
                        </button>

                        <span className="min-w-6 text-center text-sm font-bold text-[var(--brand)]">
                          {item.quantity}
                        </span>

                        <button
                          aria-label={`Increase ${item.product_name} quantity`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--brand)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={isUpdating || unavailable || cannotIncrease}
                          onClick={() =>
                            handleQuantityChange(item, item.quantity + 1)
                          }
                          type="button"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700 transition hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isUpdating}
                        onClick={() => handleRemoveItem(item)}
                        type="button"
                      >
                        <Trash2 size={16} />
                        {isUpdating ? "Updating..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--brand)]">
                <PackageOpen size={20} />
              </span>

              <div>
                <p className="text-sm font-bold text-[var(--brand)]">
                  Order summary
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {cartData.summary.total_quantity} item
                  {cartData.summary.total_quantity === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4 border-y border-[var(--border)] py-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Subtotal</dt>
                <dd className="font-bold text-[var(--brand)]">
                  {formatMoney(cartData.summary.subtotal)}
                </dd>
              </div>

              {preorderDepositTotal > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">
                    Preorder deposit due
                  </dt>
                  <dd className="font-bold text-[var(--brand)]">
                    {formatMoney(preorderDepositTotal)}
                  </dd>
                </div>
              )}
            </dl>

            {hasUnavailableItem ? (
              <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">
                Remove unavailable items before checkout.
              </p>
            ) : (
              <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
                Delivery details and secure checkout will be added in the next
                step.
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
