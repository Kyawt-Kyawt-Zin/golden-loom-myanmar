import { ArrowRight, PackageCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-bold tracking-[0.18em] text-[var(--accent)]">
              MADE IN MYANMAR · DELIVERED IN DUBAI
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight text-[var(--brand)] sm:text-5xl">
              Warm sweaters with a story woven into every piece.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              Discover sweaters made in Myanmar for women, men, and everyone.
              Choose ready-to-deliver styles in Dubai or preorder a special
              piece with a simple 20% deposit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                Shop sweaters
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full border border-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand)] transition hover:bg-[var(--surface-muted)]"
              >
                How preorder works
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-6 shadow-sm sm:p-8">
            <div className="flex h-full min-h-72 flex-col justify-between rounded-[1.5rem] bg-[var(--brand)] p-7 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--brand-strong)]">
                <Sparkles size={24} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-wide text-[#fff0c7]">
                  GOLDEN LOOM PROMISE
                </p>

                <h2 className="mt-3 text-3xl font-bold leading-tight">
                  Comfortable pieces, carefully chosen for your everyday
                  wardrobe.
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
            SIMPLE SHOPPING
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[var(--brand)]">
            Choose the option that suits you
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <PackageCheck
              size={28}
              className="text-[var(--accent)]"
              aria-hidden="true"
            />

            <h3 className="mt-5 text-xl font-bold text-[var(--brand)]">
              In-stock delivery
            </h3>

            <p className="mt-2 leading-7 text-[var(--text-muted)]">
              Choose standard delivery, quick delivery, or a pickup time slot in
              Dubai. Cash on delivery is available for in-stock sweaters.
            </p>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <Sparkles
              size={28}
              className="text-[var(--accent)]"
              aria-hidden="true"
            />

            <h3 className="mt-5 text-xl font-bold text-[var(--brand)]">
              Preorder from Myanmar
            </h3>

            <p className="mt-2 leading-7 text-[var(--text-muted)]">
              Reserve selected designs with a 20% deposit. We will clearly show
              the preorder lead time before you confirm your order.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
