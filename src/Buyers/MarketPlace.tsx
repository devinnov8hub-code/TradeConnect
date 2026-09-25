import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import BuyerLayout from "../components/BuyerLayout";
import { useCart } from "./CartContext";
import { formatNaira } from "../lib/format";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { Category } from "../lib/types/category";
import { getActiveListings } from "../lib/services/listings.service";
import { type Listing } from "../lib/types/listing";
import { getPublicCategories } from "../lib/services/categories.service";
import { toast, ToastContainer } from "react-toastify";
import type { MarketplaceSummary } from "../lib/types/marketplace";
import { getMarketplaceSummary } from "../lib/services/marketplace.service";

const ALL_PRODUCE = "All Produce";

const cardBg = [
  "bg-rose-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-lime-50",
];

export const Marketplace = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(ALL_PRODUCE);
  const [listings, setListings] = useState<Listing[]>([]);
  const [metrics, setmetrics] = useState<MarketplaceSummary | null>(null);
  // null = the dedicated /categories endpoint hasn't returned yet (or isn't
  // deployed on this backend) — falls back to categories derived from the
  // loaded listings below.
  const [apiCategories, setApiCategories] = useState<Category[] | null>(null);
  const { items: cartItems, addItem } = useCart();
  const [loading, setLoading] = useState(true);

  const marketplaceMetrics = [
    { label: "Listings", value: `${metrics?.listings ?? 0}` },
    { label: "Farmers", value: `${metrics?.farmers ?? 0}+` },
    { label: "LGAs", value: `${metrics?.lgas ?? 0}+` },
  ];
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getMarketplaceSummary();
        setmetrics(response);
      } catch (error) {
        getErrorMessage(error);
      }
    };
    fetchMetrics();
  }, []);

  const derivedCategories = useMemo(() => {
    const byId = new Map<number, Category>();
    listings.forEach((listing) => {
      const category = listing.produce.category;
      if (category && !byId.has(category.id)) {
        byId.set(category.id, {
          id: category.id,
          name: category.name,
          created_at: "",
          updated_at: "",
        });
      }
    });
    return Array.from(byId.values());
  }, [listings]);

  const categories = apiCategories ?? derivedCategories;

  const filtered = useMemo(
    () =>
      activeCategory === ALL_PRODUCE
        ? listings
        : listings.filter((p) => p.produce.category.name === activeCategory),
    [activeCategory, listings],
  );

  useEffect(() => {
    const fetchlistings = async () => {
      try {
        const response = await getActiveListings();
        setListings(response.data);
      } catch (error) {
        getErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    fetchlistings();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getPublicCategories();
        setApiCategories(response);
      } catch (error) {
        // /categories isn't deployed on every backend yet — fall back to
        // categories derived from listings instead of leaving the strip empty.
        getErrorMessage(error);
      }
    };
    fetchCategories();
  }, []);

  const addToCart = (product: Listing) => {
    const inCartQty =
      cartItems.find((item) => item.listing_id === product.id)?.quantity ?? 0;
    if (product.stock <= 0 || inCartQty >= product.stock) {
      toast.error(
        ` ${product.stock} ${product.unit ?? "unit"} of ${product.produce.name} available`,
      );
      return;
    }
    addItem(product);
    toast.success(`${product.produce.name} successfully added to cart`);
  };

  return (
    <BuyerLayout breadcrumb="Marketplace / Overview">
      <ToastContainer />
      <main className="pb-6">
        <section className="banner-primary flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-sm font-bold tracking-wide mb-3">
              FRESH FROM THE FARM
            </h1>
            <p className="max-w-md text-lg text-gray-200">
              Fresh produce gotten directly from verified farms.
            </p>
            <p className="max-w-md text-sm text-gray-300">
              Quality produce directly from trusted farmers. Fast delivery
              across Nigeria.
            </p>
          </div>
          <div className="flex items-center gap-8">
            {marketplaceMetrics?.map((metric) => (
              <div key={metric.label} className="text-center text-white">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-gray-300">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500 mr-1">
            Browse by category
          </span>
          <button
            onClick={() => setActiveCategory(ALL_PRODUCE)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === ALL_PRODUCE
                ? "bg-primary text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {ALL_PRODUCE}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === category.name
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            All Listings
          </h2>
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="loader"></div>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">
              No listings available.
            </div>
          )}
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product, idx) => (
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
                        addToCart(product);
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
      </main>
    </BuyerLayout>
  );
};
