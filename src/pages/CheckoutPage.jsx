import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import {
  checkoutMyCart,
  getActiveBankAccounts,
  getDeliveryZones,
  getMyCart,
} from "../services/api.js";
import DepositProofUpload from "../components/DepositProofUpload.jsx";

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

export default function CheckoutPage({ session, onCartChanged }) {
  const [cartData, setCartData] = useState(emptyCartData);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [recipient, setRecipient] = useState({
    recipientName: "",
    recipientPhone: "",
  });

  const [inStockDelivery, setInStockDelivery] = useState({
    deliveryMethod: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    pickupTimeSlot: "",
    paymentMethod: "",
  });

  const [preorderDelivery, setPreorderDelivery] = useState({
    deliveryMethod: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    pickupTimeSlot: "",
    remainingPaymentMethod: "",
  });

  const [preorderTermsAccepted, setPreorderTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isPreorderZonePickerOpen, setIsPreorderZonePickerOpen] =
    useState(true);
  const [isInStockZonePickerOpen, setIsInStockZonePickerOpen] = useState(true);

  const loadCheckoutData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);

      const [cart, zones] = await Promise.all([
        getMyCart(session.token),
        getDeliveryZones(),
      ]);

      setCartData(cart);
      setDeliveryZones(zones);
    } catch (error) {
      setErrorMessage(error.message || "Unable to prepare checkout.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  const hasInStockItems = cartData.items.some(
    (item) => item.fulfillment_type === "in_stock",
  );

  const hasPreorderItems = cartData.items.some(
    (item) => item.fulfillment_type === "preorder",
  );

  const updateRecipient = (field, value) => {
    setRecipient((currentRecipient) => ({
      ...currentRecipient,
      [field]: value,
    }));
  };

  const updateDelivery = (orderType, field, value) => {
    const setDelivery =
      orderType === "inStock" ? setInStockDelivery : setPreorderDelivery;

    setDelivery((currentDelivery) => {
      const nextDelivery = {
        ...currentDelivery,
        [field]: value,
      };

      if (field === "deliveryMethod") {
        const paymentField =
          orderType === "inStock" ? "paymentMethod" : "remainingPaymentMethod";

        nextDelivery[paymentField] =
          value === ""
            ? ""
            : value === "pickup"
              ? "cash_on_pickup"
              : "cash_on_delivery";
      }

      return nextDelivery;
    });
  };

  const selectedPreorderZone = deliveryZones.find(
    (zone) => String(zone.id) === String(preorderDelivery.deliveryZoneId),
  );

  const selectPreorderZone = (zoneId) => {
    updateDelivery("preorder", "deliveryZoneId", String(zoneId));
    setIsPreorderZonePickerOpen(false);
  };

  const selectedInStockZone = deliveryZones.find(
    (zone) => String(zone.id) === String(inStockDelivery.deliveryZoneId),
  );

  const isDeliveryComplete = (delivery, paymentField) => {
    if (!delivery.deliveryMethod || !delivery[paymentField]) {
      return false;
    }

    if (delivery.deliveryMethod === "pickup") {
      return true;
    }

    return Boolean(delivery.deliveryZoneId && delivery.deliveryAddress.trim());
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!recipient.recipientName.trim() || !recipient.recipientPhone.trim()) {
      setErrorMessage("Recipient name and phone are required.");
      return;
    }

    if (
      hasInStockItems &&
      !isDeliveryComplete(inStockDelivery, "paymentMethod")
    ) {
      setErrorMessage("Complete all in-stock delivery and payment details.");
      return;
    }

    if (
      hasPreorderItems &&
      !isDeliveryComplete(preorderDelivery, "remainingPaymentMethod")
    ) {
      setErrorMessage("Complete all preorder delivery and payment details.");
      return;
    }

    if (hasPreorderItems && !preorderTermsAccepted) {
      setErrorMessage("Accept the preorder deposit terms before checkout.");
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const checkoutData = {
        ...recipient,
        preorderTermsAccepted,
      };

      if (hasInStockItems) {
        checkoutData.inStockDelivery = {
          ...inStockDelivery,
          pickupTimeSlot: "",
          deliveryZoneId: Number(inStockDelivery.deliveryZoneId) || null,
        };
      }

      if (hasPreorderItems) {
        checkoutData.preorderDelivery = {
          ...preorderDelivery,
          deliveryZoneId: Number(preorderDelivery.deliveryZoneId) || null,
        };
      }

      const result = await checkoutMyCart(session.token, checkoutData);

      const hasCreatedPreorder = result.orders.some(
        (order) => order.fulfillment_type === "preorder",
      );

      if (hasCreatedPreorder) {
        try {
          const accounts = await getActiveBankAccounts();
          setBankAccounts(accounts);
        } catch {
          setBankAccounts([]);
        }
      }

      setCheckoutResult(result);
      setCartData(emptyCartData);
      onCartChanged?.(emptyCartData);
    } catch (error) {
      setErrorMessage(error.message || "Unable to complete checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInStockDeliveryFee = (zone) => {
    return inStockDelivery.deliveryMethod === "quick"
      ? zone.quick_fee
      : zone.standard_fee;
  };

  const inStockFee = !hasInStockItems ? 0 : inStockDelivery.deliveryMethod === "pickup"
    ? 0
    : inStockDelivery.deliveryMethod && selectedInStockZone
      ? Number(getInStockDeliveryFee(selectedInStockZone))
      : null;
  const preorderFee = !hasPreorderItems ? 0 : preorderDelivery.deliveryMethod === "pickup"
    ? 0
    : preorderDelivery.deliveryMethod && selectedPreorderZone
      ? Number(selectedPreorderZone.standard_fee)
      : null;
  const hasDeliveryFees = inStockFee !== null && preorderFee !== null;
  const estimatedTotal = Number(cartData.summary.subtotal) + (inStockFee ?? 0) + (preorderFee ?? 0);

  const selectInStockZone = (zoneId) => {
    updateDelivery("inStock", "deliveryZoneId", String(zoneId));
    setIsInStockZonePickerOpen(false);
  };

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto text-[var(--accent)]" size={34} />
          <h1 className="mt-5 text-3xl font-bold text-[var(--brand)]">
            Sign in before checkout
          </h1>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white"
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
        <div className="h-72 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
      </main>
    );
  }

  if (checkoutResult) {
    const preorderOrders = checkoutResult.orders.filter(
      (order) => order.fulfillment_type === "preorder",
    );

    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-emerald-200 bg-[var(--surface)] p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold tracking-[0.16em] text-emerald-700">
            ORDER RECEIVED
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            Thank you — we received your order
          </h1>

          <p className="mt-3 leading-7 text-[var(--text-muted)]">
            {preorderOrders.length > 0
              ? "Your preorder is awaiting a 20% deposit and staff verification before production can begin."
              : "Your order was received and is awaiting processing."}
          </p>

          <div className="mt-7 space-y-3">
            {checkoutResult.orders.map((order) => (
              <div
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between"
                key={order.id}
              >
                <div>
                  <p className="font-bold text-[var(--brand)]">
                    {order.order_number}
                  </p>
                  <p className="mt-1 text-sm capitalize text-[var(--text-muted)]">
                    {order.fulfillment_type.replaceAll("_", " ")} order
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="font-bold text-[var(--brand)]">
                    {formatMoney(order.total_amount)}
                  </p>

                  {order.fulfillment_type === "preorder" && (
                    <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
                      Deposit due: {formatMoney(order.deposit_amount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {preorderOrders.length > 0 && (
            <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-bold tracking-[0.12em] text-amber-800">
                PREORDER DEPOSIT
              </p>

              <h2 className="mt-1 text-xl font-bold text-[var(--brand)]">
                Transfer your 20% deposit
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Use one of the active AED bank accounts below. After
                transferring the deposit, upload your payment screenshot and
                transaction reference for staff confirmation.
              </p>

              {bankAccounts.length > 0 ? (
                <div className="mt-4 space-y-3">
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

                      {account.transfer_instructions && (
                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                          {account.transfer_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-white p-4 text-sm text-amber-900">
                  Bank-account details are temporarily unavailable. Please
                  contact Golden Loom Myanmar before making a transfer.
                </p>
              )}

              {bankAccounts.length > 0 && (
                <div className="mt-5 space-y-4">
                  {preorderOrders.map((order) =>
                    order.deposit_payment_id ? (
                      <DepositProofUpload
                        amount={order.deposit_amount}
                        key={order.deposit_payment_id}
                        paymentId={order.deposit_payment_id}
                        session={session}
                      />
                    ) : (
                      <p
                        className="rounded-xl bg-white p-4 text-sm text-amber-900"
                        key={order.id}
                      >
                        Receipt upload will be available from your order details
                        shortly.
                      </p>
                    ),
                  )}
                </div>
              )}
            </section>
          )}

          <Link
            className="mt-7 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            to="/shop"
          >
            Continue shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
        to="/cart"
      >
        <ArrowLeft size={17} />
        Back to cart
      </Link>

      <div className="mt-4">
        <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
          SECURE CHECKOUT
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--brand)]">
          Delivery and payment details
        </h1>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
          <button
            className="ml-3 font-bold underline"
            onClick={loadCheckoutData}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {cartData.items.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-[var(--brand)]">
            Your cart is empty
          </h2>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white"
            to="/shop"
          >
            Shop sweaters
          </Link>
        </section>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--brand)]">
                1
              </span>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Recipient name
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    onChange={(event) =>
                      updateRecipient("recipientName", event.target.value)
                    }
                    placeholder="Full name for delivery"
                    required
                    value={recipient.recipientName}
                  />
                </label>

                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Recipient phone
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    inputMode="tel"
                    onChange={(event) =>
                      updateRecipient("recipientPhone", event.target.value)
                    }
                    placeholder="+971 50 123 4567"
                    required
                    value={recipient.recipientPhone}
                  />
                </label>
              </div>
            </div>

            {hasInStockItems && (
              <section className="mt-6 border-t border-[var(--border)] pt-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--brand)]">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[var(--brand)]">
                      In-stock delivery
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      For items currently available in Dubai.
                    </p>
                  </div>
                </div>

                <label className="mt-4 block text-sm font-semibold text-[var(--text-main)]">
                  Delivery method
                  <span className="relative mt-2 block">
                    <select
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--accent)]"
                      onChange={(event) =>
                        updateDelivery(
                          "inStock",
                          "deliveryMethod",
                          event.target.value,
                        )
                      }
                      value={inStockDelivery.deliveryMethod}
                    >
                      <option value="">Choose a delivery method</option>
                      <option value="standard">Standard delivery</option>
                      <option value="quick">Quick delivery</option>
                      <option value="pickup">Customer pickup</option>
                    </select>

                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]"
                      size={18}
                    />
                  </span>
                </label>
                {inStockDelivery.deliveryMethod === "pickup" ? (
                  <p className="mt-4 text-sm text-[var(--text-muted)]">After your order is confirmed, choose a pickup time within seven days, between 9:00 AM and 3:00 PM Dubai time, on your order details page. <Link className="font-semibold text-[var(--brand)] underline" to="/contact" target="_blank" rel="noopener noreferrer">See pickup location and contact</Link>.</p>
                ) : inStockDelivery.deliveryMethod === "" ? null : (
                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Delivery area
                      </p>

                      {selectedInStockZone && (
                        <button
                          className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--brand)] bg-[var(--accent-soft)] px-4 py-3 text-left text-[var(--brand)]"
                          onClick={() =>
                            setIsInStockZonePickerOpen((isOpen) => !isOpen)
                          }
                          type="button"
                        >
                          <span>
                            <span className="block text-sm font-bold">
                              {selectedInStockZone.name}
                            </span>
                            <span className="mt-0.5 block text-xs capitalize">
                              {inStockDelivery.deliveryMethod} delivery
                            </span>
                          </span>

                          <span className="flex items-center gap-2 text-sm font-bold">
                            {formatMoney(
                              getInStockDeliveryFee(selectedInStockZone),
                            )}
                            <ChevronDown
                              aria-hidden="true"
                              className={`transition ${
                                isInStockZonePickerOpen ? "rotate-180" : ""
                              }`}
                              size={18}
                            />
                          </span>
                        </button>
                      )}

                      {(!selectedInStockZone || isInStockZonePickerOpen) && (
                        <div
                          aria-label="Choose your in-stock delivery area"
                          className="mt-2 grid gap-2 sm:grid-cols-2"
                          role="radiogroup"
                        >
                          {deliveryZones.map((zone) => {
                            const deliveryFee = getInStockDeliveryFee(zone);
                            const isSelected =
                              String(inStockDelivery.deliveryZoneId) ===
                              String(zone.id);

                            return (
                              <button
                                aria-checked={isSelected}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                  isSelected
                                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] hover:border-[var(--accent)]"
                                }`}
                                key={zone.id}
                                onClick={() => selectInStockZone(zone.id)}
                                role="radio"
                                type="button"
                              >
                                <span className="min-w-0 truncate text-sm font-semibold">
                                  {zone.name}
                                </span>

                                <span className="flex shrink-0 items-center gap-2 text-sm font-bold">
                                  {formatMoney(deliveryFee)}
                                  {isSelected && (
                                    <Check aria-hidden="true" size={16} />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <label className="block text-sm font-semibold text-[var(--text-main)]">
                      Delivery address
                      <textarea
                        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                        onChange={(event) =>
                          updateDelivery(
                            "inStock",
                            "deliveryAddress",
                            event.target.value,
                          )
                        }
                        placeholder="Building, street, apartment or villa number"
                        required
                        value={inStockDelivery.deliveryAddress}
                      />
                    </label>
                  </div>
                )}
                <label className="mt-4 block text-sm font-semibold text-[var(--text-main)]">
                  Payment method
                  <span className="relative mt-2 block">
                    <select
                      className="mt-2 w-full rounded-xl appearance-none border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--accent)]"
                      onChange={(event) =>
                        updateDelivery(
                          "inStock",
                          "paymentMethod",
                          event.target.value,
                        )
                      }
                      value={inStockDelivery.paymentMethod}
                    >
                      {inStockDelivery.deliveryMethod === "pickup" ? (
                        <>
                          <option value="cash_on_pickup">Cash on pickup</option>
                          <option value="bank_transfer">Bank transfer</option>
                        </>
                      ) : (
                        <>
                          <option value="cash_on_delivery">
                            Cash on delivery
                          </option>
                          <option value="bank_transfer">Bank transfer</option>
                        </>
                      )}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]"
                      size={18}
                    />
                  </span>
                </label>
              </section>
            )}

            {hasPreorderItems && (
              <section className="mt-6 border-t border-[var(--border)] pt-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--brand)]">
                    {hasInStockItems ? "3" : "2"}
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[var(--brand)]">
                      Preorder delivery
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      A 20% bank-transfer deposit will be required after
                      checkout.
                    </p>
                  </div>
                </div>

                <label className="mt-4 block text-sm font-semibold text-[var(--text-main)]">
                  Delivery method
                  <span className="relative mt-2 block">
                    <select
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--accent)]"
                      onChange={(event) =>
                        updateDelivery(
                          "preorder",
                          "deliveryMethod",
                          event.target.value,
                        )
                      }
                      value={preorderDelivery.deliveryMethod}
                    >
                      <option value="">Choose a delivery method</option>
                      <option value="standard">Standard delivery</option>
                      <option value="pickup">Customer pickup</option>
                    </select>

                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]"
                      size={18}
                    />
                  </span>
                </label>

                {preorderDelivery.deliveryMethod === "pickup" ? (
                  <p className="mt-4 text-sm text-[var(--text-muted)]">Once your preorder is ready for pickup, choose a time within seven days, between 9:00 AM and 3:00 PM Dubai time, on your order details page. <Link className="font-semibold text-[var(--brand)] underline" to="/contact" target="_blank" rel="noopener noreferrer">See pickup location and contact</Link>.</p>
                ) : preorderDelivery.deliveryMethod ? (
                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        Delivery area
                      </p>

                      {selectedPreorderZone && (
                        <button
                          className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--brand)] bg-[var(--accent-soft)] px-4 py-3 text-left text-[var(--brand)]"
                          onClick={() =>
                            setIsPreorderZonePickerOpen((isOpen) => !isOpen)
                          }
                          type="button"
                        >
                          <span>
                            <span className="block text-sm font-bold">
                              {selectedPreorderZone.name}
                            </span>
                            <span className="mt-0.5 block text-xs">
                              Standard delivery
                            </span>
                          </span>

                          <span className="flex items-center gap-2 text-sm font-bold">
                            {formatMoney(selectedPreorderZone.standard_fee)}
                            <ChevronDown
                              aria-hidden="true"
                              className={`transition ${
                                isPreorderZonePickerOpen ? "rotate-180" : ""
                              }`}
                              size={18}
                            />
                          </span>
                        </button>
                      )}

                      {(!selectedPreorderZone || isPreorderZonePickerOpen) && (
                        <div
                          aria-label="Choose your preorder delivery area"
                          className="mt-2 grid gap-2 sm:grid-cols-2"
                          role="radiogroup"
                        >
                          {deliveryZones.map((zone) => {
                            const isSelected =
                              String(preorderDelivery.deliveryZoneId) ===
                              String(zone.id);

                            return (
                              <button
                                aria-checked={isSelected}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                  isSelected
                                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] hover:border-[var(--accent)]"
                                }`}
                                key={zone.id}
                                onClick={() => selectPreorderZone(zone.id)}
                                role="radio"
                                type="button"
                              >
                                <span className="min-w-0 truncate text-sm font-semibold">
                                  {zone.name}
                                </span>

                                <span className="flex shrink-0 items-center gap-2 text-sm font-bold">
                                  {formatMoney(zone.standard_fee)}
                                  {isSelected && (
                                    <Check aria-hidden="true" size={16} />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <label className="block text-sm font-semibold text-[var(--text-main)]">
                      Delivery address
                      <textarea
                        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                        onChange={(event) =>
                          updateDelivery(
                            "preorder",
                            "deliveryAddress",
                            event.target.value,
                          )
                        }
                        placeholder="Building, street, apartment or villa number"
                        required
                        value={preorderDelivery.deliveryAddress}
                      />
                    </label>
                  </div>
                ) : null}
              </section>
            )}
            {preorderDelivery.deliveryMethod && (
              <>
                <label className="mt-4 block text-sm font-semibold text-[var(--text-main)]">
                  Remaining-balance payment
                  <span className="relative mt-2 block">
                    <select
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--accent)]"
                      onChange={(event) =>
                        updateDelivery(
                          "preorder",
                          "remainingPaymentMethod",
                          event.target.value,
                        )
                      }
                      value={preorderDelivery.remainingPaymentMethod}
                    >
                      {preorderDelivery.deliveryMethod === "pickup" ? (
                        <>
                          <option value="cash_on_pickup">Cash on pickup</option>
                          <option value="bank_transfer">Bank transfer</option>
                        </>
                      ) : (
                        <>
                          <option value="cash_on_delivery">
                            Cash on delivery
                          </option>
                          <option value="bank_transfer">Bank transfer</option>
                        </>
                      )}
                    </select>

                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]"
                      size={18}
                    />
                  </span>
                </label>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <input
                    checked={preorderTermsAccepted}
                    className="mt-1 h-4 w-4 accent-[var(--brand)]"
                    onChange={(event) =>
                      setPreorderTermsAccepted(event.target.checked)
                    }
                    type="checkbox"
                  />

                  <span className="text-sm leading-6 text-[var(--text-muted)]">
                    I understand that a{" "}
                    <strong className="text-[var(--brand)]">
                      20% bank-transfer deposit
                    </strong>{" "}
                    is required to reserve preorder items. The remaining balance
                    is paid using my selected method.
                  </span>
                </label>
              </>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.12em] text-[var(--accent)]">
                  YOUR ORDER
                </p>
                <h2 className="mt-1 font-bold text-[var(--brand)]">
                  {cartData.summary.total_quantity} item
                  {cartData.summary.total_quantity === 1 ? "" : "s"}
                </h2>
              </div>
              <Link
                className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--accent)]"
                to="/cart"
              >
                Edit
              </Link>
            </div>

            <div className="mt-4 space-y-3 border-y border-[var(--border)] py-4">
              {cartData.items.map((item) => (
                <div
                  className="flex items-start justify-between gap-3 text-sm"
                  key={item.cart_item_id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--brand)]">
                      {item.product_name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {item.color} · {item.size} · ×{item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-[var(--brand)]">
                    {formatMoney(item.line_total)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 text-sm text-[var(--text-main)]">
              <div className="flex justify-between gap-3">
                <span>Items subtotal</span>
                <span>{formatMoney(cartData.summary.subtotal)}</span>
              </div>
              {hasInStockItems && (
                <div className="flex justify-between gap-3">
                  <span>In-stock delivery or pickup</span>
                  <span>{inStockFee === null ? "Choose delivery" : formatMoney(inStockFee)}</span>
                </div>
              )}
              {hasPreorderItems && (
                <div className="flex justify-between gap-3">
                  <span>Preorder delivery or pickup</span>
                  <span>{preorderFee === null ? "Choose delivery" : formatMoney(preorderFee)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-[var(--border)] pt-3 text-base font-bold text-[var(--brand)]">
                <span>Estimated total</span>
                <span>{hasDeliveryFees ? formatMoney(estimatedTotal) : "Choose delivery"}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Final amounts are confirmed when you place your order.</p>
            </div>

            <button
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleCheckout}
              type="button"
            >
              {isSubmitting
                ? "Creating your order..."
                : hasPreorderItems
                  ? "Place order and view deposit"
                  : "Place secure order"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
