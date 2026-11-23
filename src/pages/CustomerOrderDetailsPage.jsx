import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DepositProofUpload from "../components/DepositProofUpload.jsx";
import { getActiveBankAccounts, getMyOrderById } from "../services/api.js";

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

export default function CustomerOrderDetailPage({ session }) {
  const { orderId } = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOrder = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const details = await getMyOrderById(session.token, orderId);

      setOrderDetails(details);

      if (details.order.fulfillment_type === "preorder") {
        try {
          const accounts = await getActiveBankAccounts();
          setBankAccounts(accounts);
        } catch {
          setBankAccounts([]);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to load this order.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, session]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-14 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--brand)]">
            Sign in to view this order
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

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-80 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
      </main>
    );
  }

  if (errorMessage || !orderDetails) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)]"
          to="/account/orders"
        >
          <ArrowLeft size={17} />
          Back to my orders
        </Link>

        <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-semibold">
            {errorMessage || "This order is unavailable."}
          </p>
          <button
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={loadOrder}
            type="button"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const { order, items, payments } = orderDetails;
  const depositPayment = payments.find(
    (payment) => payment.payment_type === "deposit",
  );

  const isDepositPending = depositPayment?.status === "pending";
  const isDepositSubmitted = depositPayment?.status === "submitted";
  const isDepositConfirmed = depositPayment?.status === "confirmed";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
        to="/account/orders"
      >
        <ArrowLeft size={17} />
        Back to my orders
      </Link>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.15em] text-[var(--accent)]">
              ORDER DETAILS
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--brand)]">
              {order.order_number}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <CalendarDays size={16} />
              Placed {formatDate(order.created_at)}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xl font-bold text-[var(--brand)]">
              {formatMoney(order.total_amount)}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
              {formatLabel(order.status)} · {formatLabel(order.payment_status)}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-bold text-[var(--brand)]">
              Delivery details
            </h2>
          </div>

          <div className="mt-5 space-y-2 text-sm text-[var(--text-muted)]">
            <p>{formatLabel(order.delivery_method)}</p>
            <p>{order.delivery_zone_name || "Pickup"}</p>
            {order.delivery_address && <p>{order.delivery_address}</p>}
            {order.pickup_time_slot && <p>{order.pickup_time_slot}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-bold text-[var(--brand)]">
              Payment status
            </h2>
          </div>

          <p className="mt-5 font-semibold text-[var(--brand)]">
            {formatLabel(order.payment_status)}
          </p>

          {depositPayment && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Deposit amount: {formatMoney(depositPayment.amount)}
            </p>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Package className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-bold text-[var(--brand)]">Your items</h2>
        </div>

        <div className="mt-5 divide-y divide-[var(--border)]">
          {items.map((item) => (
            <div
              className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              key={item.id}
            >
              <div>
                <p className="font-semibold text-[var(--brand)]">
                  {item.product_name}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {item.color} · {item.size} · Quantity {item.quantity}
                </p>
              </div>

              <p className="shrink-0 font-bold text-[var(--brand)]">
                {formatMoney(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {order.fulfillment_type === "preorder" && (
        <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-bold tracking-[0.14em] text-amber-800">
            PREORDER DEPOSIT
          </p>

          {isDepositPending && (
            <>
              <h2 className="mt-2 text-xl font-bold text-[var(--brand)]">
                Complete your deposit
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Transfer {formatMoney(depositPayment.amount)} to an account
                below, then upload the receipt for staff verification.
              </p>

              {bankAccounts.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      className="rounded-xl border border-amber-200 bg-white p-4"
                      key={account.id}
                    >
                      <p className="font-bold text-[var(--brand)]">
                        {account.label}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {account.bank_name} · {account.account_holder}
                      </p>
                      <p className="mt-2 font-mono text-sm font-bold text-[var(--brand)]">
                        {account.account_number}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-white p-4 text-sm text-amber-900">
                  Bank account details are temporarily unavailable. Please
                  contact Golden Loom Myanmar before transferring.
                </p>
              )}

              {bankAccounts.length > 0 && (
                <div className="mt-5">
                  <DepositProofUpload
                    amount={depositPayment.amount}
                    onSubmitted={loadOrder}
                    paymentId={depositPayment.id}
                    session={session}
                  />
                </div>
              )}
            </>
          )}

          {isDepositSubmitted && (
            <p className="mt-3 rounded-xl bg-white p-4 text-sm font-semibold text-amber-900">
              Your receipt was submitted and is waiting for staff verification.
            </p>
          )}

          {isDepositConfirmed && (
            <p className="mt-3 rounded-xl bg-white p-4 text-sm font-semibold text-emerald-800">
              Your deposit has been confirmed. Production can now continue.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
