import { useEffect, useState } from "react";
import { CheckCircle2, FileImage, Upload } from "lucide-react";
import { submitDepositPaymentProof } from "../services/api.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
};

export default function DepositProofUpload({
  amount,
  paymentId,
  session,
  onSubmitted,
}) {
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!paymentProof) {
      setPreviewUrl("");
      return undefined;
    }

    const temporaryPreviewUrl = URL.createObjectURL(paymentProof);

    setPreviewUrl(temporaryPreviewUrl);

    return () => {
      URL.revokeObjectURL(temporaryPreviewUrl);
    };
  }, [paymentProof]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!allowedImageTypes.has(selectedFile.type)) {
      setPaymentProof(null);
      setErrorMessage("Choose a JPG, PNG, or WebP screenshot.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setPaymentProof(null);
      setErrorMessage("The payment screenshot must be 5 MB or smaller.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setPaymentProof(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!transactionReference.trim()) {
      setErrorMessage("Enter the bank transaction reference.");
      return;
    }

    if (!paymentProof) {
      setErrorMessage("Choose your payment screenshot first.");
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      const result = await submitDepositPaymentProof(session.token, paymentId, {
        transactionReference: transactionReference.trim(),
        paymentProof,
      });

      setSuccessMessage(
        "Receipt submitted. Our team will verify your deposit shortly.",
      );

      onSubmitted?.(result);
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit your payment proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 text-emerald-700"
            size={21}
          />

          <div>
            <p className="font-bold text-emerald-900">Receipt submitted</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              {successMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700">
          <Upload size={20} />
        </span>

        <div>
          <p className="text-sm font-bold tracking-[0.12em] text-amber-800">
            DEPOSIT RECEIPT
          </p>
          <h3 className="font-bold text-[var(--brand)]">
            Submit your {formatMoney(amount)} deposit proof
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Transfer the deposit to the bank account shown above, then upload the
        screenshot and transaction reference for staff verification.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {errorMessage}
        </p>
      )}

      <label className="mt-5 block text-sm font-semibold text-[var(--text-main)]">
        Bank transaction reference
        <input
          className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          onChange={(event) => {
            setTransactionReference(event.target.value);
            setErrorMessage("");
          }}
          placeholder="For example: MB-20261123-001"
          value={transactionReference}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-[var(--text-main)]">
        Payment screenshot
        <span className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-white px-4 py-3 text-sm text-[var(--text-muted)]">
          <span className="flex min-w-0 items-center gap-2">
            <FileImage className="shrink-0 text-amber-700" size={18} />
            <span className="truncate">
              {paymentProof
                ? paymentProof.name
                : "Choose JPG, PNG, or WebP image"}
            </span>
          </span>
          <span className="shrink-0 font-semibold text-[var(--brand)]">
            Browse
          </span>

          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            type="file"
          />
        </span>
      </label>

      {previewUrl && (
        <img
          alt="Selected payment screenshot preview"
          className="mt-4 max-h-72 w-full rounded-xl border border-amber-200 bg-white object-contain"
          src={previewUrl}
        />
      )}

      <button
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        <Upload size={18} />
        {isSubmitting ? "Submitting receipt..." : "Submit receipt for review"}
      </button>
    </form>
  );
}
