import { ArrowRight, Package, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../services/api.js";

const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatItemCount = (quantity) => {
  const total = Number(quantity || 0);

  return `${total} item${total === 1 ? "" : "s"}`;
};

const getCustomerOrderStatus = (status) => {
  const customerLabels = {
    pending: "Order received",
    processing: "Preparing your order",
    ready_for_delivery: "Ready for delivery",
    out_for_delivery: "Out for delivery",
    ready_for_pickup: "Ready for pickup",
    delivered: "Delivered",
    picked_up: "Picked up",
    cancelled: "Cancelled",
  };

  return customerLabels[status] || formatLabel(status);
};

const getCustomerPaymentLabel = (order) => {
  if (
    order.payment_status === "unpaid" &&
    order.payment_method === "cash_on_delivery"
  ) {
    return "Pay on delivery";
  }

  if (
    order.payment_status === "unpaid" &&
    order.payment_method === "cash_on_pickup"
  ) {
    return "Pay on pickup";
  }

  return formatLabel(order.payment_status);
};

const getPaymentStyle = (paymentStatus) => {
  if (paymentStatus === "deposit_confirmed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (paymentStatus === "deposit_pending") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-stone-100 text-stone-700";
};

export default function MyOrdersPage({ session }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOrders = async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const orderData = await getMyOrders(session.token);
      setOrders(orderData);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load your orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [session]);

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-14 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <Package className="mx-auto text-[var(--accent)]" size={34} />
          <h1 className="mt-5 text-3xl font-bold text-[var(--brand)]">
            Sign in to view your orders
          </h1>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white"
            to="/account"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
            CUSTOMER ACCOUNT
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            My orders
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Track delivery progress and complete any required preorder deposit.
          </p>
        </div>

        <Link
          className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
          to="/account"
        >
          Back to account
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-8 h-52 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
      ) : errorMessage ? (
        <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-semibold">{errorMessage}</p>
          <button
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={loadOrders}
            type="button"
          >
            Try again
          </button>
        </section>
      ) : orders.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <ReceiptText className="mx-auto text-[var(--accent)]" size={34} />
          <h2 className="mt-5 text-2xl font-bold text-[var(--brand)]">
            No orders yet
          </h2>
          <p className="mt-2 text-[var(--text-muted)]">
            Your completed purchases will appear here.
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white"
            to="/shop"
          >
            Shop sweaters
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              key={order.id}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[var(--brand)]">
                      {order.order_number}
                    </p>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                      {formatLabel(order.fulfillment_type)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStyle(
                        order.payment_status,
                      )}`}
                    >
                      {formatLabel(order.payment_status)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[var(--text-muted)]">
                    Placed {formatDate(order.created_at)} ·{" "}
                    {formatLabel(order.status)}
                  </p>

                  {order.fulfillment_type === "preorder" &&
                    order.payment_status === "deposit_pending" && (
                      <p className="mt-3 text-sm font-semibold text-amber-800">
                        Deposit due: {formatMoney(order.deposit_amount)}
                      </p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-5 sm:block sm:text-right">
                  <p className="font-bold text-[var(--brand)]">
                    {formatMoney(order.total_amount)}
                  </p>
                  <Link
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
                    to={`/account/orders/${order.id}`}
                  >
                    View order
                    <ArrowRight size={16} />
                  </Link>
                  {['pending', 'confirmed'].includes(order.status) && (
                    <Link className="ml-4 mt-2 inline-flex text-sm font-semibold text-rose-700 hover:underline" to={`/account/orders/${order.id}#cancellation`}>
                      Request cancellation
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
