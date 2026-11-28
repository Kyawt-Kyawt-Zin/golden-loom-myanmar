import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CreditCard,
  MapPin,
  Package,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import DepositProofUpload from "../components/DepositProofUpload.jsx";
import VariantChangeRequest from "../components/VariantChangeRequest.jsx";
import { getActiveBankAccounts, getMyOrderById, schedulePickup, getMyOrderChangeRequests, requestOrderCancellation } from "../services/api.js";

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
  value === "deposit_submitted" ? "Receipt submitted · awaiting confirmation" : String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CustomerOrderDetailPage({ session }) {
  const { orderId } = useParams();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupHour, setPickupHour] = useState("");
  const [pickupMinute, setPickupMinute] = useState("00");
  const [pickupError, setPickupError] = useState("");
  const [pickupSaving, setPickupSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestLoadError, setRequestLoadError] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [acceptForfeit, setAcceptForfeit] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);

  const handlePickupSubmit = async (event) => {
    event.preventDefault();
    setPickupSaving(true);
    setPickupError("");
    try {
      await schedulePickup(session.token, orderId, pickupDate, `${pickupHour}:${pickupMinute}`);
      await loadOrder();
    } catch (error) {
      setPickupError(error.message || "Unable to save pickup time.");
    } finally {
      setPickupSaving(false);
    }
  };

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

      try {
        setRequests(await getMyOrderChangeRequests(session.token));
        setRequestLoadError("");
      } catch {
        setRequestLoadError("Unable to load cancellation requests. Please try again.");
      }

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

  useEffect(() => {
    if (!isLoading && orderDetails && ["#cancellation", "#pickup"].includes(location.hash)) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
  }, [isLoading, orderDetails, location.hash]);

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
            state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
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
  const cancellation = requests.find((request) => request.order_number === order.order_number && request.request_type === "cancel_order");
  const latePreorder = order.fulfillment_type === "preorder" && order.cancellation_deadline && Date.now() > new Date(order.cancellation_deadline).getTime();
  const submitCancellation = async (event) => {
    event.preventDefault();
    setCancelSaving(true);
    setCancelError("");
    try {
      await requestOrderCancellation(session.token, orderId, cancelNote, acceptForfeit);
      await loadOrder();
    } catch (error) {
      setCancelError(error.message || "Unable to submit your request.");
    } finally {
      setCancelSaving(false);
    }
  };
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
        <section id="pickup" className="scroll-mt-32 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-bold text-[var(--brand)]">
              Delivery details
            </h2>
          </div>

          <div className="mt-5 space-y-2 text-sm text-[var(--text-muted)]">
            <p>{formatLabel(order.delivery_method)}</p>
            <p>{order.delivery_zone_name || "Pickup"}</p>
            {order.delivery_method === "pickup" && <p><Link className="font-semibold text-[var(--brand)] underline" to="/contact">Pickup location and contact</Link></p>}
            {order.delivery_address && <p>{order.delivery_address}</p>}
            {order.pickup_time_slot && <p>{order.pickup_time_slot}</p>}
            {order.delivery_method === "pickup" && !order.pickup_window && !order.pickup_time_slot && (
              <p>{["pending", "confirmed", "processing"].includes(order.status) && order.fulfillment_type === "preorder" ? "Choose your pickup time once your preorder is ready." : order.status === "pending" ? "Choose your pickup time after your order is confirmed." : "Please contact us to arrange pickup."}</p>
            )}
            {order.delivery_method === "pickup" && order.pickup_window && ["confirmed", "processing", "ready_for_pickup"].includes(order.status) && (order.fulfillment_type !== "preorder" || order.status === "ready_for_pickup") && (
              order.pickup_window.expired || order.pickup_window.minDate > order.pickup_window.maxDate ? (
                <p>The pickup window has passed. Please contact us to arrange pickup.</p>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={handlePickupSubmit}>
                  <p>Choose a future pickup time within seven days, between 9:00 AM and 3:00 PM Dubai time.</p>
                  <label className="block">Pickup date<input className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" type="date" min={order.pickup_window.minDate} max={order.pickup_window.maxDate} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required /></label>
                  <fieldset>
                    <legend className="font-semibold">Pickup time</legend>
                    <p className="mt-1">Pickup hours: 9:00 AM–3:00 PM Dubai time.</p>
                    <div className="mt-2 flex items-end gap-3">
                      <label className="flex-1">Hour<span className="relative mt-1 block"><select className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 appearance-none pr-10" value={pickupHour} onChange={(e) => { setPickupHour(e.target.value); if (e.target.value === "15") setPickupMinute("00"); }} required><option value="">Choose hour</option>{[9, 10, 11, 12, 13, 14, 15].map((hour) => <option value={String(hour).padStart(2, "0")} key={hour}>{hour > 12 ? hour - 12 : hour} {hour < 12 ? "AM" : "PM"}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand)]" size={18} /></span></label>
                      <span className="pb-3 font-bold">:</span>
                      <label className="flex-1">Minute<span className="relative mt-1 block"><select className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 appearance-none pr-10" value={pickupMinute} onChange={(e) => setPickupMinute(e.target.value)}>{Array.from({ length: pickupHour === "15" ? 1 : 60 }, (_, minute) => <option value={String(minute).padStart(2, "0")} key={minute}>{String(minute).padStart(2, "0")}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand)]" size={18} /></span></label>
                    </div>
                  </fieldset>
                  {pickupError && <p role="alert" className="text-rose-700">{pickupError}</p>}
                  <button className="rounded-xl bg-[var(--brand)] px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={pickupSaving} type="submit">{pickupSaving ? "Saving…" : "Save pickup time"}</button>
                </form>
              )
            )}
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
                {["pending", "confirmed"].includes(order.status) && <VariantChangeRequest item={item} order={order} token={session.token} />}
              </div>

              <p className="shrink-0 font-bold text-[var(--brand)]">
                {formatMoney(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="cancellation" className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--brand)]">Cancellation request</h2>
        {requestLoadError ? <p className="mt-3 text-sm text-rose-700">{requestLoadError}</p> : cancellation && cancellation.status === "pending" ? (
          <p className="mt-3 text-sm">Your cancellation request is awaiting approval. Your order is not cancelled yet.</p>
        ) : ["pending", "confirmed"].includes(order.status) ? (
          <form className="mt-3 space-y-3" onSubmit={submitCancellation}>
            {cancellation?.staff_note && <p className="text-sm">Previous request: {cancellation.staff_note}</p>}
            <p className="text-sm">Send a cancellation request. Your order remains active until the request is approved.</p>
            <label className="block text-sm">Reason (optional)<textarea className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" maxLength={500} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} /></label>
            {latePreorder && <label className="flex gap-2 text-sm"><input type="checkbox" checked={acceptForfeit} onChange={(e) => setAcceptForfeit(e.target.checked)} required />The seven-day cancellation period has ended. I understand the deposit is non-refundable.</label>}
            {cancelError && <p role="alert" className="text-sm text-rose-700">{cancelError}</p>}
            <button type="submit" disabled={cancelSaving} className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">{cancelSaving ? "Sending…" : "Request cancellation"}</button>
          </form>
        ) : <p className="mt-3 text-sm">This order can no longer be cancelled online. Please contact us for help.</p>}
      </section>

      {order.fulfillment_type === "preorder" && (
        <section className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
          <p className="text-sm font-bold tracking-[0.14em] text-[var(--brand)]">
            PREORDER DEPOSIT
          </p>

          {isDepositPending && (
            <>
              <h2 className="mt-2 text-xl font-bold text-[var(--brand)]">
                Complete your deposit
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Transfer {formatMoney(depositPayment.amount)} to an account
                below, then upload the receipt for confirmation.
              </p>

              {bankAccounts.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
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
              Thank you! Your receipt was submitted and is awaiting confirmation.
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
