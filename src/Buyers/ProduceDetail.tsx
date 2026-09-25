import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import BuyerLayout from "../components/BuyerLayout";
import { useCart } from "./CartContext";
import { formatNaira } from "../lib/format";
import { getErrorMessage } from "../lib/getErrorMessage";
import {
  getActiveListing,
  getActiveListings,
} from "../lib/services/listings.service";
import type { Listing } from "../lib/types/listing";

const cardBg = [
  "bg-rose-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-lime-50",
];

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3">{children}</div>
      )}
    </div>
  );
}

export default function ProduceDetail() {
  const { id } = useParams();
  const listingId = Number(id);
  const navigate = useNavigate();
  const { items: cartItems, addItem, updateQty } = useCart();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [similar, setSimilar] = useState<Listing[]>([]);

  useEffect(() => {
    const loadListing = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getActiveListing(listingId);
        setListing(response);
        setActiveImage(
          response.primary_image_url ?? response.produce.image_url,
        );
        setQuantity(
          Math.min(
            response.minimum_order_quantity ?? 1,
            Math.max(response.stock, 1),
          ),
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(listingId)) loadListing();
  }, [listingId]);

  useEffect(() => {
    if (!listing) return;
    const loadSimilar = async () => {
      try {
        const response = await getActiveListings({
          category_id: listing.produce.category.id,
          per_page: 7,
        });
        setSimilar(
          response.data.filter((item) => item.id !== listing.id).slice(0, 6),
        );
      } catch (err) {
        // Similar products are a nice-to-have — don't block the page on it.
        getErrorMessage(err);
      }
    };
    loadSimilar();
  }, [listing]);

  if (loading) {
    return (
      <BuyerLayout breadcrumb="Marketplace / Listing View">
        <div className="flex items-center justify-center py-24">
          <div className="loader"></div>
        </div>
      </BuyerLayout>
    );
  }

  if (error || !listing) {
    return (
      <BuyerLayout breadcrumb="Marketplace / Listing View">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            {error || "This listing could not be found."}
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Back to Marketplace
          </button>
        </div>
      </BuyerLayout>
    );
  }

  const gallery = listing.images?.length
    ? listing.images.map((img) => img.url)
    : [listing.primary_image_url ?? listing.produce.image_url];

  const minQty = Math.max(listing.minimum_order_quantity ?? 1, 1);
  const maxQty = Math.max(listing.stock, 0);
  const outOfStock = listing.stock <= 0;
  const unit = listing.stock;
  const price = Number(listing.price);
  const originalPrice = listing.original_price
    ? Number(listing.original_price)
    : null;
  const discountPercent = listing.discount_percent
    ? Math.round(Number(listing.discount_percent))
    : null;
  const deliveryFeePerUnit = listing.delivery_fee_per_unit ?? 0;

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.min(Math.max(prev + delta, minQty), maxQty));
  };

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error(`${listing.produce.name} is currently out of stock`);
      return;
    }
    const existingQty =
      cartItems.find((item) => item.listing_id === listing.id)?.quantity ?? 0;

    if (existingQty === 0) {
      addItem(listing);
      if (quantity > 1) {
        updateQty(listing.id, Math.min(quantity, listing.stock));
      }
    } else {
      const nextQty = Math.min(existingQty + quantity, listing.stock);
      if (nextQty === existingQty) {
        toast.error(`Only ${listing.stock} ${unit} available`);
        return;
      }
      updateQty(listing.id, nextQty);
    }
    toast.success(`${listing.produce.name} added to cart`);
  };

  const quickAddToCart = (product: Listing) => {
    const inCartQty =
      cartItems.find((item) => item.listing_id === product.id)?.quantity ?? 0;
    if (product.stock <= 0 || inCartQty >= product.stock) {
      toast.error(
        `${product.stock} ${product.unit ?? "unit"} of ${product.produce.name} available`,
      );
      return;
    }
    addItem(product);
    toast.success(`${product.produce.name} successfully added to cart`);
  };

  return (
    <BuyerLayout breadcrumb="Marketplace / Listing View">
      <ToastContainer />
      <button
        onClick={() => navigate("/marketplace")}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gallery */}
        <div className="rounded-3xl bg-global-bg p-4">
          <img
            src={activeImage ?? undefined}
            alt={listing.produce.name}
            className="h-96 w-full rounded-2xl object-cover"
          />
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((url) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(url)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                    activeImage === url
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 bg-white p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-global-bg px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                {listing.produce.category.name}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium uppercase text-slate-400">
                <MapPin className="h-3 w-3" />
                {listing.farmer.state} · {listing.farmer.lga} LGA
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold capitalize text-slate-900">
                {listing.produce.name}
              </h1>
              {listing.label && (
                <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium capitalize text-emerald-700">
                  {listing.label}
                </span>
              )}
            </div>

            {listing.description && (
              <p className="text-sm text-slate-500">{listing.description}</p>
            )}

            <div
              className={`grid gap-3 ${listing.grade ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Availability
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {outOfStock ? "Out of Stock" : "In Stock"}
                </p>
              </div>
              {listing.grade && (
                <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Grade
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {listing.grade}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-3xl font-bold text-primary">
                {formatNaira(price)}
              </p>
              {originalPrice && originalPrice > price ? (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-slate-400 line-through">
                    {formatNaira(originalPrice)} per unit
                  </p>
                  {discountPercent !== null && discountPercent > 0 && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                      {discountPercent}% off
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-400">per unit</p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-slate-200">
                  <button
                    onClick={() => adjustQuantity(-1)}
                    disabled={outOfStock || quantity <= minQty}
                    className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => adjustQuantity(1)}
                    disabled={outOfStock || quantity >= maxQty}
                    className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-slate-500">units</span>
              </div>
              {minQty > 1 && (
                <p className="mt-1 text-xs text-slate-400">
                  Minimum order: {minQty}/{unit}
                </p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#4A7C2A] py-3 text-sm font-semibold text-white hover:bg-[#3A6C1A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>

          <CollapsibleSection title="Product Details">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-800">
                  {listing.produce.category.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Unit</dt>
                <dd className="font-medium text-slate-800">
                  {unit} units available
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Minimum Order</dt>
                <dd className="font-medium text-slate-800">{minQty} units</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Farmer</dt>
                <dd className="font-medium text-slate-800">
                  {listing.farmer.name}
                </dd>
              </div>
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Delivery & Availability">
            <p className="text-sm text-slate-500">
              Standard delivery available to {listing.farmer.state} and
              neighbouring LGAs at {formatNaira(deliveryFeePerUnit)} per {unit}—
              total delivery cost scales with the quantity ordered.
            </p>
          </CollapsibleSection>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Similar Products
          </h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => navigate(`/marketplace/produce/${product.id}`)}
                className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <img
                  className={`flex h-28 w-full items-center justify-center rounded-2xl object-cover text-5xl ${cardBg[idx % cardBg.length]}`}
                  src={product.primary_image_url ?? product.produce.image_url}
                  alt={product.produce.name}
                />
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-global-bg px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    {product.produce.category.name}
                  </span>
                  <p className="mt-2 font-semibold text-slate-900 capitalize">
                    {product.produce.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {product.farmer.state} - {product.farmer.lga}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {product.stock} {product.unit} available
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">
                      {formatNaira(Number(product.price))}/{product.unit}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickAddToCart(product);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-[#4A7C2A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3A6C1A]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BuyerLayout>
  );
}
