import {
  ChevronDown,
  PackageCheck,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCatalogImageUrl, getCatalogProducts } from "../services/api.js";

const pageLimit = 12;

const formatPrice = (price) => {
  const amount = Number(price);

  return Number.isFinite(amount)
    ? `AED ${amount.toFixed(2)}`
    : "Price unavailable";
};

const formatGender = (gender) => {
  if (!gender) {
    return "Unisex";
  }

  return `${gender.slice(0, 1).toUpperCase()}${gender.slice(1)}`;
};

const availabilityLabel = (product) => {
  if (!product.has_in_stock && !product.has_preorder) {
    return "Out of stock";
  }

  if (product.has_in_stock && product.has_preorder) {
    return "In stock & preorder";
  }

  return product.has_in_stock ? "In stock in Dubai" : "Preorder from Myanmar";
};

export default function ShopPage() {
  const [catalog, setCatalog] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const loadCatalog = async () => {
      try {
        const catalogData = await getCatalogProducts({
          page,
          limit: pageLimit,
          search,
          gender,
        });

        if (isCurrentRequest) {
          setCatalog(catalogData);
          setErrorMessage("");
        }
      } catch (error) {
        if (isCurrentRequest) {
          setErrorMessage(
            error.message || "Unable to load the sweater catalog.",
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      isCurrentRequest = false;
    };
  }, [page, search, gender, reloadKey]);

  const handleSearch = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setPage(1);
    setSearch(searchInput);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const clearFilters = () => {
    setIsLoading(true);
    setSearchInput("");
    setSearch("");
    setGender("");
    setPage(1);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const retryCatalogLoad = () => {
    setIsLoading(true);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const items = catalog?.items || [];
  const pagination = catalog?.pagination;
  const isFirstPage = !pagination || pagination.page <= 1;
  const isLastPage = !pagination || pagination.page >= pagination.totalPages;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">
              SWEATER COLLECTION
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[var(--brand)] sm:text-4xl">
              Find your next favourite sweater
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-muted)]">
              Explore active Golden Loom Myanmar styles available for Dubai
              delivery or preorder from Myanmar.
            </p>
          </div>

          {pagination && (
            <p className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand)]">
              {pagination.total} {pagination.total === 1 ? "style" : "styles"}{" "}
              available
            </p>
          )}
        </div>

        <form
          className="mt-8 grid gap-3 border-t border-[var(--border)] pt-6 md:grid-cols-[1fr_13rem_auto]"
          onSubmit={handleSearch}
        >
          <label className="relative block">
            <span className="sr-only">Search sweaters</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={19}
            />
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--page-bg)] py-3 pl-11 pr-4 text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by sweater or category"
              type="search"
              value={searchInput}
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Filter by gender</span>
            <select
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 pr-12 text-[var(--text-main)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              onChange={(event) => {
                setIsLoading(true);
                setGender(event.target.value);
                setPage(1);
                setReloadKey((currentKey) => currentKey + 1);
              }}
              value={gender}
            >
              <option value="">All genders</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]"
              size={19}
            />
          </label>

          <div className="flex gap-3">
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] md:flex-none"
              type="submit"
            >
              <Search size={18} />
              Search
            </button>

            {(search || gender) && (
              <button
                className="rounded-xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--brand)] transition hover:bg-[var(--surface-muted)]"
                onClick={clearFilters}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-semibold">
              We could not load the sweater catalog.
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
            <button
              className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
              onClick={retryCatalogLoad}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                className="animate-pulse overflow-hidden rounded-3xl border border-[var(--border)]"
                key={item}
              >
                <div className="h-64 bg-[var(--surface-muted)]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 rounded bg-[var(--surface-muted)]" />
                  <div className="h-6 w-3/4 rounded bg-[var(--surface-muted)]" />
                  <div className="h-4 w-full rounded bg-[var(--surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] px-6 py-16 text-center">
            <SlidersHorizontal
              aria-hidden="true"
              className="mx-auto text-[var(--accent)]"
              size={30}
            />
            <h2 className="mt-4 text-xl font-bold text-[var(--brand)]">
              No sweaters match these filters
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-[var(--text-muted)]">
              Try another search word, choose a different gender, or clear your
              filters.
            </p>
            <button
              className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              onClick={clearFilters}
              type="button"
            >
              Show all sweaters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => {
                const imageUrl = getCatalogImageUrl(product.primary_image_path);

                return (
                  <article
                    className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    key={product.id}
                  >
                    <div className="aspect-[4/3] bg-[var(--surface-muted)]">
                      {imageUrl ? (
                        <img
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={imageUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                          Image coming soon
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-[var(--accent)]">
                          {product.category_name}
                        </p>
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                          {formatGender(product.target_gender)}
                        </span>
                      </div>

                      <h2 className="mt-2 text-xl font-bold text-[var(--brand)]">
                        {product.name}
                      </h2>

                      <p className="mt-2 min-h-14 text-sm leading-6 text-[var(--text-muted)]">
                        {product.description ||
                          "A Golden Loom Myanmar sweater."}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                        <p className="font-bold text-[var(--brand)]">
                          {product.starting_price == null
                            ? "Currently unavailable"
                            : `From ${formatPrice(product.starting_price)}`}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
                          {(product.has_in_stock || product.has_preorder) && (
                            <PackageCheck size={16} />
                          )}
                          {availabilityLabel(product)}
                        </span>
                      </div>

                      <Link
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--surface-muted)]"
                        to={`/shop/${product.slug}`}
                      >
                        Choose colour and size
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row">
                <p className="text-sm text-[var(--text-muted)]">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <div className="flex gap-3">
                  <button
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold text-[var(--brand)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isFirstPage}
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => currentPage - 1);
                    }}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isLastPage}
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => currentPage + 1);
                    }}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
