import { ArrowRight, PackageCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import sweaterCollection from "../assets/sweater-collection.jpg";

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14 lg:px-8 lg:py-14">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] shadow-sm lg:order-2">
            <img src={sweaterCollection} alt="A collection of colourful Golden Loom Myanmar sweaters" className="aspect-[4/3] w-full object-cover object-top lg:aspect-square" fetchPriority="high" />
          </div>
          <div className="flex flex-col justify-center lg:order-1">
            <p className="mb-3 text-xs font-bold tracking-[0.15em] text-[var(--accent)] sm:text-sm">
              MADE IN MYANMAR · DELIVERED IN DUBAI
            </p>
            <h1 className="max-w-xl text-3xl font-bold leading-tight text-[var(--brand)] sm:text-5xl">
              Find your next favourite sweater.
            </h1>
            <p className="mt-4 max-w-lg leading-7 text-[var(--text-muted)]">
              Explore our collection, ready in Dubai or available to preorder.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--on-brand)] transition hover:bg-[var(--brand-strong)]"
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
