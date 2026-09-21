import { ArrowLeftIcon, X } from "lucide-react";
import Avatar from "../components/Avatar";
import Layout from "../components/Layout";
import addImage from "../assets/add image.png";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getListing, updateListing } from "../lib/services/listings.service";
import { updateProduce } from "../lib/services/produce.service";
import { getFarmers } from "../lib/services/farmers.service";
import { getErrorMessage } from "../lib/getErrorMessage";
import type {
  Listing,
  ListingPayload,
  ListingStatus,
} from "../lib/types/listing";
import type { Farmer, FarmerSummary } from "../lib/types/farmer";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const EditListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [status, setStatus] = useState<ListingStatus>("active");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const imagePreviewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );

  const [assignedFarmer, setAssignedFarmer] = useState<FarmerSummary | null>(
    null,
  );
  const [showFarmerPicker, setShowFarmerPicker] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersLoaded, setFarmersLoaded] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    const loadListing = async () => {
      setListingLoading(true);
      setError("");
      try {
        const response = await getListing(Number(id));
        setListing(response);
        setAssignedFarmer(response.farmer);
        setPrice(String(response.price));
        setStock(String(response.stock));
        setMinOrderQty(
          response.minimum_order_quantity
            ? String(response.minimum_order_quantity)
            : "",
        );
        setStatus(response.status);
        setDeliveryFee(
          response.delivery_fee_per_unit
            ? String(response.delivery_fee_per_unit)
            : "",
        );
        console.log("Loaded listing:", response);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setListingLoading(false);
      }
    };
    loadListing();
  }, [id]); 

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const openFarmerPicker = async () => {
    setShowFarmerPicker(true);
    if (farmersLoaded) return;

    setFarmersLoading(true);
    try {
      setFarmers((await getFarmers({ per_page: 100 })).data);
      setFarmersLoaded(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFarmersLoading(false);
    }
  };

  const handleSelectFarmer = (farmer: Farmer) => {
    setAssignedFarmer(farmer);
    setShowFarmerPicker(false);
    setFarmerSearch("");
  };

  const filteredFarmers = farmers.filter((farmer) =>
    `${farmer.name} ${farmer.state} ${farmer.lga}`
      .toLowerCase()
      .includes(farmerSearch.toLowerCase()),
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5MB or smaller");
      e.target.value = "";
      return;
    }
    setError("");
    setImage(file);
  };

  const handleSaveListing = async () => {
    if (!listing) return;
    setError("");

    if (!price || Number(price) < 0)
      return setError("Please enter a valid price");
    if (!stock || Number(stock) < 0)
      return setError("Please enter a valid stock quantity");
    if (!assignedFarmer) return setError("Please assign a farmer");

    setSaving(true);
    try {
      if (image) {
        await updateProduce(listing.produce.id, {
          category_id: listing.produce.category.id,
          name: listing.produce.name,
          image,
        });
      }

      const payload: Partial<ListingPayload> = {
        price: Number(price),
        stock: Number(stock),
        minimum_order_quantity: minOrderQty ? Number(minOrderQty) : undefined,
        delivery_fee_per_unit: deliveryFee ? Number(deliveryFee) : undefined,
        status,
        publication_status: status === "active" ? "live" : "pending",
      };
      if (assignedFarmer.id !== listing.farmer_id) {
        payload.farmer_id = assignedFarmer.id;
      }

      await updateListing(listing.id, payload);
      navigate("/listings");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (listingLoading) {
    return (
      <Layout breadcrumb="Listings / Edit Listing" compact>
        <p className="mt-6 text-sm text-gray-400">Loading listing...</p>
      </Layout>
    );
  }

  return (
    <Layout breadcrumb="Listings / Edit Listing" compact>
      <Link to="/listings">
        <button className="flex text-sm items-center gap-2 text-gray-600 hover:text-white">
          <ArrowLeftIcon />
          Back to Listings
        </button>
      </Link>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-3 text-sm text-primary">
          {error}
        </div>
      )}

      {listing && (
        <>
          <section className="bg-white border-l-3 border-primary p-6 rounded-lg mt-6">
            <div className="flex gap-4 items-center">
              <img
                src={imagePreviewUrl ?? listing.produce.image_url}
                alt=""
                className="w-26 h-26 rounded-full object-cover"
              />
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold capitalize">
                  {listing.produce.name}
                </h1>
                <p className="text-gray-400 font-medium border border-[#4A7C2A] rounded px-4 py-1 text-sm w-fit">
                  {listing.produce.category.name}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg mt-6">
            <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold">Produce Image</h1>
              <p className="text-gray-400 font-medium">
                Replace the image displayed to buyers for this produce
              </p>
            </div>
            <div className="flex flex-col justify-between gap-2 mb-4 border p-20 border-dashed border-gray-400 items-center rounded-md">
              <img src={addImage} alt="add file image" />
              <p className="font-bold text-md">Drag and drop image here</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="items-center flex justify-center text-center text-primary"
                onChange={handleImageChange}
              />
            </div>
            <div className="flex gap-1 justify-between items-center">
              <p className="text-gray-400 text-sm">
                Supported formats: JPG, PNG, WebP
              </p>
              <p className="text-gray-400 text-sm">Max file size: 5MB</p>
            </div>

            {image && (
              <div className="flex flex-col gap-2 mb-4 w-2/5 mt-4">
                Uploaded files
                <div className="flex items-center justify-between border border-[#4A7C2A]/30 rounded-lg p-2">
                  <span>{image.name}</span>
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-lg mt-6">
            <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold">Farmer Assignment</h1>
              <p className="text-gray-400 font-medium">
                Who this produce belongs to
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-[#4A7C2A]/10 p-3">
              <div className="flex items-center gap-3">
                <Avatar name={assignedFarmer?.name ?? ""} />
                <div>
                  <p className="font-medium text-slate-900">
                    {assignedFarmer?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {assignedFarmer?.state} - {assignedFarmer?.lga}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFarmerPicker
                    ? setShowFarmerPicker(false)
                    : openFarmerPicker()
                }
                className="font-medium text-[#4A7C2A]"
              >
                {showFarmerPicker ? "Cancel" : "Change"}
              </button>
            </div>

            {showFarmerPicker && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <input
                  type="search"
                  placeholder="Search farmers..."
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  className="w-full border border-[#4A7C2A]/30 bg-global-bg rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C2A]"
                />
                <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {farmersLoading && (
                    <p className="text-sm text-gray-400">Loading farmers...</p>
                  )}
                  {!farmersLoading && filteredFarmers.length === 0 && (
                    <p className="text-sm text-gray-400">No farmers found.</p>
                  )}
                  {filteredFarmers.map((farmer) => (
                    <div
                      key={farmer.id}
                      onClick={() => handleSelectFarmer(farmer)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                        assignedFarmer?.id === farmer.id
                          ? "border-[#4A7C2A] bg-[#4A7C2A]/10"
                          : "border-[#4A7C2A]/30 hover:bg-[#4A7C2A]/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={farmer.name} />
                        <div>
                          <p className="font-medium text-slate-900">
                            {farmer.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {farmer.state} - {farmer.lga}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-lg mt-6">
            <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold">Pricing & Stock</h1>
              <p className="text-gray-400 font-medium">
                How much is this produce being sold for and how much is
                available
              </p>
            </div>
            <div className="flex justify-between gap-2 mb-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="font-medium">Price per unit</label>
                <div className="flex items-center border border-[#4A7C2A]/30 rounded-md focus-within:ring-2 focus-within:ring-[#4A7C2A]">
                  <span className="p-2.5 border-r border-gray-300 bg-global-bg text-sm text-gray-400">
                    N
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    className="w-full py-2 px-3 focus:outline-none rounded-sm"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <span className="p-2.5 border-r border-gray-300 bg-global-bg text-sm text-gray-400">
                    /kg
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="font-medium">Available Stock</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  className="border border-[#4A7C2A]/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C2A]"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <p className="text-gray-400 text-sm">
                  In the same unit selected above
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4 w-2/5">
              <label className="font-medium">Minimum Order Quantity</label>
              <input
                type="number"
                placeholder="e.g. 5"
                className="border border-[#4A7C2A]/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C2A]"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
              />
            </div>
          </section>

          <section className="bg-white p-6 rounded-lg mt-6">
            <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold">Delivery Pricing</h1>
              <p className="text-gray-400 font-medium">
                The cumulative delivery cost of buyer order.
              </p>
            </div>
            <div className="flex justify-between gap-2 mb-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="font-medium">Price per unit</label>
                <div className="flex items-center border border-[#4A7C2A]/30 rounded-md focus-within:ring-2 focus-within:ring-[#4A7C2A]">
                  <span className="p-2.5 border-r border-gray-300 bg-global-bg text-sm text-gray-400">
                    N
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    className="w-full py-2 px-3 focus:outline-none rounded-sm"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                  />
                  {/* <span className="p-2.5 border-r border-gray-300 bg-global-bg text-sm text-gray-400">
                    /kg
                  </span> */}
                </div>
              </div>
              {/* <div className="flex flex-col gap-2 w-full">
                <label className="font-medium">Buyer Stock</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  className="border border-[#4A7C2A]/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#4A7C2A]"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <p className="text-gray-400 text-sm">
                  In the same unit selected above
                </p>
              </div> */}
            </div>
            <p className="text-gray-400 text-sm">
              Total delivery cost will be derived from the price per unit and
              order quantity.
            </p>
            {/* <div className="flex flex-col gap-2 mb-4 w-2/5">
              <label className="font-medium">Total Delivery Cost</label>
              <div className="flex items-center border border-[#4A7C2A]/30 rounded-md focus-within:ring-2 focus-within:ring-[#4A7C2A]">
                <span className="p-2.5 border-r border-gray-300 bg-global-bg text-sm text-gray-400">
                  N
                </span>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full py-2 px-3 focus:outline-none rounded-sm"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </div>
            </div> */}
          </section>

          <section className="bg-white p-6 rounded-lg mt-6">
            <div className="flex flex-col gap-1 border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold">Listing Status</h1>
              <p className="text-gray-400 font-medium">
                Decide whether this listing should be published immediately.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className={`font-bold py-3 px-4 rounded-md border border-[#4A7C2A] ${status === "active" ? "bg-[#27AE603D]" : "text-[#4A7C2A]"}`}
                onClick={() => setStatus("active")}
              >
                Publish Listing Now
                <p className="text-sm text-gray-400">
                  Visible to buyers on the marketplace immediately
                </p>
              </button>
              <button
                type="button"
                className={`font-bold py-3 px-4 rounded-md border border-[#4A7C2A] ${status === "inactive" ? "bg-[#27AE603D]" : "text-[#4A7C2A]"}`}
                onClick={() => setStatus("inactive")}
              >
                Save as Inactive
                <p className="text-sm text-gray-400">
                  Hidden from buyers until you activate it later
                </p>
              </button>
            </div>
          </section>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/listings")}
              className="font-semibold text-[#4A7C2A] py-3 px-4 rounded-md border border-[#4A7C2A] hover:bg-[#3e6b22]"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveListing}
              disabled={saving}
              className="bg-[#4A7C2A] font-semibold text-white py-3 px-4 rounded-md hover:bg-[#3e6b22] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </Layout>
  );
};

export default EditListing;
