import { ShoppingBag, Check, Clock3, PackageCheck, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addItemToCart,
  getCatalogImageUrl,
  getCatalogProductBySlug,
  getMyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/api.js";

const formatPrice = (price) => {
  const amount = Number(price);

  return Number.isFinite(amount)
    ? `AED ${amount.toFixed(2)}`
    : "Price unavailable";
};

const formatGender = (gender) =>
  `${gender.slice(0, 1).toUpperCase()}${gender.slice(1)}`;

const isVariantOutOfStock = (variant) =>
  Boolean(
    variant &&
    variant.fulfillment_type === "in_stock" &&
    Number(variant.stock_quantity) <= 0,
  );

const getAvailabilityMessage = (variant) => {
  if (isVariantOutOfStock(variant)) {
    return "Currently out of stock";
  }
  if (variant.fulfillment_type === "in_stock") {
    return `In stock in Dubai · ${variant.stock_quantity} available`;
  }

  return `Preorder from Myanmar · approximately ${variant.preorder_lead_days} days`;
};

export default function ProductDetailPage({ session, onCartChanged }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [catalogProduct, setCatalogProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [cartErrorMessage, setCartErrorMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartData, setCartData] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(Boolean(session?.token));
  const [cartLoadError, setCartLoadError] = useState("");
  const [cartReloadKey, setCartReloadKey] = useState(0);
  const cartRequestVersion = useRef(0);
  const currentCustomerId = useRef(session?.user?.id);
  currentCustomerId.current = session?.user?.id;

  useEffect(() => {
    const version = ++cartRequestVersion.current;
    let active = true;
    if (!session?.token) {
      setCartData(null);
      setCartLoadError("");
      setIsCartLoading(false);
      return () => { active = false; };
    }

    setIsCartLoading(true);
    setCartLoadError("");
    getMyCart(session.token)
      .then((cart) => {
        if (active && version === cartRequestVersion.current) setCartData(cart);
      })
      .catch((error) => {
        if (active && version === cartRequestVersion.current) {
          setCartLoadError(error.message || "Unable to load your cart.");
        }
      })
      .finally(() => {
        if (active && version === cartRequestVersion.current) setIsCartLoading(false);
      });
    return () => { active = false; };
  }, [session?.token, session?.user?.id, cartReloadKey]);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadProduct = async () => {
      try {
        const productData = await getCatalogProductBySlug(slug);

        if (isCurrentRequest) {
          setCatalogProduct(productData);
          setSelectedImageId(productData.images[0]?.id || null);
          setErrorMessage("");
        }
      } catch (error) {
        if (isCurrentRequest) {
          setErrorMessage(error.message || "Unable to load this sweater.");
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isCurrentRequest = false;
    };
  }, [slug]);

  const variants = catalogProduct?.variants || [];
  const allVariantsOutOfStock =
    variants.length > 0 && variants.every(isVariantOutOfStock);

  const colors = [
    ...new Set([
      ...(catalogProduct?.images || []).flatMap((image) => {
        if (image.product_variant_id == null) {
          return [];
        }

        const linkedVariant = variants.find(
          (variant) => Number(variant.id) === Number(image.product_variant_id),
        );

        return linkedVariant ? [linkedVariant.color] : [];
      }),
      ...variants.map((variant) => variant.color),
    ]),
  ];
  const sizesForColor = variants
    .filter((variant) => variant.color === selectedColor)
    .map((variant) => variant.size);
  const selectedVariant = variants.find(
    (variant) =>
      variant.color === selectedColor && variant.size === selectedSize,
  );
  const selectedCartItem = cartData?.items?.find(
    (item) => Number(item.product_variant_id) === Number(selectedVariant?.id),
  );
  const cannotIncrease = selectedCartItem && selectedVariant?.fulfillment_type === "in_stock" &&
    Number(selectedCartItem.quantity) >= Number(selectedVariant.stock_quantity);

  useEffect(() => {
    setCartMessage("");
    setCartErrorMessage("");
  }, [selectedVariant?.id]);

  const selectedImage = useMemo(() => {
    const images = catalogProduct?.images || [];

    return images.find((image) => image.id === selectedImageId) || images[0];
  }, [catalogProduct?.images, selectedImageId]);
  const selectedImageVariant =
    selectedImage?.product_variant_id == null
      ? null
      : variants.find(
          (variant) =>
            Number(variant.id) === Number(selectedImage.product_variant_id),
        );

  const showThumbnailStockMessage =
    !allVariantsOutOfStock &&
    selectedImageVariant &&
    selectedColor === selectedImageVariant.color &&
    !selectedSize &&
    isVariantOutOfStock(selectedImageVariant);

  const handleColorSelection = (color) => {
    const linkedImage = catalogProduct?.images.find((image) =>
      variants.some(
        (variant) =>
          variant.color === color &&
          Number(variant.id) === Number(image.product_variant_id),
      ),
    );

    setSelectedColor(color);
    setSelectedSize("");

    if (linkedImage) {
      setSelectedImageId(linkedImage.id);
    }
  };

  const handleSizeSelection = (size) => {
    const exactVariant = variants.find(
      (variant) => variant.color === selectedColor && variant.size === size,
    );
    const linkedImage = catalogProduct?.images.find(
      (image) => Number(image.product_variant_id) === Number(exactVariant?.id),
    );

    setSelectedSize(size);

    if (linkedImage) {
      setSelectedImageId(linkedImage.id);
    }
  };

  const handleImageSelection = (image) => {
    const linkedVariant = variants.find(
      (variant) => Number(variant.id) === Number(image.product_variant_id),
    );

    setSelectedImageId(image.id);

    if (linkedVariant) {
      setSelectedColor(linkedVariant.color);
      setSelectedSize("");
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isVariantOutOfStock(selectedVariant)) {
      return;
    }

    if (!session) {
      navigate("/account");
      return;
    }

    try {
      setCartErrorMessage("");
      setCartMessage("");
      setIsAddingToCart(true);

      const updatedCart = await addItemToCart(session.token, {
        productVariantId: selectedVariant.id,
        quantity: 1,
      });

      if (currentCustomerId.current !== session.user?.id) return;
      cartRequestVersion.current += 1;
      setCartData(updatedCart);
      setIsCartLoading(false);
      onCartChanged?.(updatedCart);

      setCartMessage(
        `${product.name} (${selectedVariant.color} · ${selectedVariant.size}) was added to your cart.`,
      );
    } catch (error) {
      setCartErrorMessage(
        error.message || "Unable to add this item to your cart.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = async (change) => {
    if (!session || !selectedCartItem || isAddingToCart) return;
    const nextQuantity = Number(selectedCartItem.quantity) + change;
    if (change > 0 && (cannotIncrease || isVariantOutOfStock(selectedVariant))) return;
    if (nextQuantity === 0 && !window.confirm("Remove this item from your cart?")) return;

    try {
      setCartErrorMessage("");
      setCartMessage("");
      setIsAddingToCart(true);
      const updatedCart = nextQuantity === 0
        ? await removeCartItem(session.token, selectedCartItem.cart_item_id)
        : await updateCartItemQuantity(session.token, selectedCartItem.cart_item_id, nextQuantity);
      if (currentCustomerId.current !== session.user?.id) return;
      cartRequestVersion.current += 1;
      setCartData(updatedCart);
      setIsCartLoading(false);
      onCartChanged?.(updatedCart);
    } catch (error) {
      setCartErrorMessage(error.message || "Unable to update item quantity.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-[var(--surface-muted)]" />
          <div className="space-y-5">
            <div className="h-5 w-32 rounded bg-[var(--surface-muted)]" />
            <div className="h-12 w-3/4 rounded bg-[var(--surface-muted)]" />
            <div className="h-24 rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage || !catalogProduct) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <h1 className="text-2xl font-bold">This sweater is unavailable</h1>
          <p className="mt-3">
            {errorMessage || "Please return to the catalog."}
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800"
            to="/shop"
          >
            Return to shop
          </Link>
        </section>
      </main>
    );
  }

  const { product, images } = catalogProduct;
  const selectedImageUrl = getCatalogImageUrl(selectedImage?.image_path);
  const depositAmount = selectedVariant
    ? (Number(selectedVariant.price) *
        Number(selectedVariant.deposit_percentage)) /
      100
    : null;

  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        className="inline-flex text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--accent)]"
        to="/shop"
      >
        Back to sweaters
      </Link>

      <section className="mt-6 grid min-w-0 grid-cols-1 gap-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8 lg:grid-cols-2 lg:p-10">
        <div className="min-w-0">
          <div className="aspect-square overflow-hidden rounded-3xl bg-[var(--surface-muted)]">
            {selectedImageUrl ? (
              <img
                alt={selectedImage?.alt_text || product.name}
                className="h-full w-full object-cover"
                src={selectedImageUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                Image coming soon
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex min-w-0 max-w-full gap-3 overflow-x-auto pb-1">
              {images.map((image) => {
                const imageUrl = getCatalogImageUrl(image.image_path);
                const isSelected = image.id === selectedImage?.id;

                return (
                  <button
                    aria-label={`View ${image.alt_text || product.name} image`}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                      isSelected
                        ? "border-[var(--accent)]"
                        : "border-transparent hover:border-[var(--border)]"
                    }`}
                    key={image.id}
                    onClick={() => handleImageSelection(image)}
                    type="button"
                  >
                    {imageUrl && (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={imageUrl}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="text-[var(--accent)]">
              {product.category_name}
            </span>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--brand)]">
              {formatGender(product.target_gender)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-[var(--brand)] sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {product.description || "A Golden Loom Myanmar sweater."}
          </p>

          {allVariantsOutOfStock && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900"
            >
              All options for this sweater are currently out of stock.
            </p>
          )}

          {showThumbnailStockMessage && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900"
            >
              {selectedImageVariant.color} · {selectedImageVariant.size} is
              currently out of stock.
            </p>
          )}

          <div className="mt-7 border-y border-[var(--border)] py-6">
            <p className="text-sm font-bold text-[var(--text-main)]">
              Choose colour
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedColor === color
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--border)] text-[var(--brand)] hover:bg-[var(--surface-muted)]"
                  }`}
                  key={color}
                  onClick={() => handleColorSelection(color)}
                  type="button"
                >
                  {selectedColor === color && (
                    <Check className="mr-1 inline" size={16} />
                  )}
                  {color}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-bold text-[var(--text-main)]">
              Choose size
            </p>
            {selectedColor ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {sizesForColor.map((size) => (
                  <button
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedSize === size
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--border)] text-[var(--brand)] hover:bg-[var(--surface-muted)]"
                    }`}
                    key={size}
                    onClick={() => handleSizeSelection(size)}
                    type="button"
                  >
                    {selectedSize === size && (
                      <Check className="mr-1 inline" size={16} />
                    )}
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Choose a colour first to see its available sizes.
              </p>
            )}
          </div>

          {selectedVariant ? (
            <section className="mt-6 rounded-2xl bg-[var(--surface-muted)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-muted)]">
                    Your selected option
                  </p>
                  <p className="mt-1 text-lg font-bold text-[var(--brand)]">
                    {selectedVariant.color} · {selectedVariant.size}
                  </p>
                </div>

                <p className="text-xl font-bold text-[var(--brand)]">
                  {formatPrice(selectedVariant.price)}
                </p>
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm font-medium text-[var(--text-main)]">
                {isVariantOutOfStock(
                  selectedVariant,
                ) ? null : selectedVariant.fulfillment_type === "in_stock" ? (
                  <PackageCheck
                    className="mt-0.5 shrink-0 text-emerald-700"
                    size={18}
                  />
                ) : (
                  <Clock3
                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                    size={18}
                  />
                )}
                {getAvailabilityMessage(selectedVariant)}
              </p>

              {selectedVariant.fulfillment_type === "preorder" && (
                <p className="mt-3 rounded-xl bg-[var(--surface)] p-3 text-sm leading-6 text-[var(--text-muted)]">
                  A {selectedVariant.deposit_percentage}% deposit of{" "}
                  {formatPrice(depositAmount)} is required to reserve this
                  preorder. The remaining balance is paid on delivery or pickup.
                </p>
              )}

              {cartErrorMessage && (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {cartErrorMessage}
                </p>
              )}

              {cartMessage && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {cartMessage}
                </p>
              )}

              {session && cartLoadError ? (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                  <p>{cartLoadError}</p>
                  <button className="mt-2 font-bold underline" onClick={() => setCartReloadKey((key) => key + 1)} type="button">Try again</button>
                </div>
              ) : session && selectedCartItem ? (
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[var(--text-main)]">Quantity in cart</p>
                    <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                      <button aria-label={Number(selectedCartItem.quantity) === 1 ? "Remove item from cart" : "Decrease quantity"} className="inline-flex h-12 w-12 items-center justify-center text-[var(--brand)] disabled:opacity-45" disabled={isAddingToCart || isCartLoading} onClick={() => handleQuantityChange(-1)} type="button"><Minus size={18} /></button>
                      <span aria-live="polite" className="min-w-10 text-center font-bold text-[var(--text-main)]">{selectedCartItem.quantity}</span>
                      <button aria-label="Increase quantity" className="inline-flex h-12 w-12 items-center justify-center text-[var(--brand)] disabled:opacity-45" disabled={isAddingToCart || isCartLoading || cannotIncrease || isVariantOutOfStock(selectedVariant)} onClick={() => handleQuantityChange(1)} type="button"><Plus size={18} /></button>
                    </div>
                  </div>
                  <Link className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)]" to="/cart"><ShoppingBag size={18} />Go to cart</Link>
                </div>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isAddingToCart || isCartLoading || isVariantOutOfStock(selectedVariant)}
                  onClick={handleAddToCart}
                  type="button"
                >
                  <ShoppingBag size={18} />
                  {isVariantOutOfStock(selectedVariant)
                    ? "Out of stock"
                    : !session
                      ? "Sign in to add to cart"
                      : isCartLoading
                        ? "Loading cart..."
                        : isAddingToCart
                          ? "Adding to cart..."
                          : "Add to cart"}
                </button>
              )}
            </section>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm leading-6 text-[var(--text-muted)]">
              Choose both a colour and size to see the exact price and
              availability.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
