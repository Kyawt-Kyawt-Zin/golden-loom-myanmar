import { useState } from "react";
import { getCatalogProductBySlug, requestVariantChange } from "../services/api.js";

export default function VariantChangeRequest({ item, order, token }) {
  const [options, setOptions] = useState(null);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadOptions = async () => {
    setBusy(true);
    setMessage("");
    try {
      const product = await getCatalogProductBySlug(item.product_slug);
      setOptions(product.variants.filter((variant) =>
        Number(variant.id) !== Number(item.product_variant_id) &&
        variant.fulfillment_type === order.fulfillment_type &&
        Number(variant.price) === Number(item.unit_price) &&
        (variant.fulfillment_type !== "in_stock" || Number(variant.stock_quantity) >= Number(item.quantity)),
      ));
    } catch {
      setMessage("Available variants could not be loaded. Please contact us for help.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await requestVariantChange(token, order.id, item.id, selected);
      setMessage("Your change request is awaiting approval. Your current variant remains unchanged until approved.");
      setOptions(null);
    } catch (error) {
      setMessage(error.message || "Unable to send your request.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mt-2 text-sm">
    <button type="button" disabled={busy} onClick={loadOptions} className="font-semibold text-[var(--brand)] underline disabled:opacity-60">Request a colour or size change</button>
    {options && (options.length ? <form onSubmit={submit} className="mt-2 space-y-2">
      <label className="block">Choose a new variant<select required value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2"><option value="">Select colour and size</option>{options.map((variant) => <option key={variant.id} value={variant.id}>{variant.color} · {variant.size}</option>)}</select></label>
      <button disabled={busy} className="rounded-xl bg-[var(--brand)] px-3 py-2 font-semibold text-white disabled:opacity-60" type="submit">Send change request</button>
    </form> : <p className="mt-2">No other matching variants are currently available. Please contact us for help.</p>)}
    {message && <p role="status" className="mt-2">{message}</p>}
  </div>;
}
