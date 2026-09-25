import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Store, Truck } from "lucide-react";
import BuyerLayout from "../components/BuyerLayout";
import OrderSummaryModal from "./OrderSummaryModal";
import { useCart } from "./CartContext";
import { formatNaira } from "../lib/format";
import {
  createOrder,
  initializeOrderPayment,
  verifyOrderPayment,
} from "../lib/services/orders.service";
import type { CreateOrderPayload, DeliveryMethod } from "../lib/types/order";
import { getErrorMessage } from "../lib/getErrorMessage";
import { lgasByState, nigerianStates } from "../lib/data/nigeria-lgas";
import Paystack from "@paystack/inline-js";
import { toast, ToastContainer } from "react-toastify";

export default function Checkout() {
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("standard");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    // items: items,
    delivery_method: deliveryMethod,
    delivery_name: "",
    delivery_phone: "",
    delivery_state: "",
    delivery_lga: "",
    delivery_address: "",
    delivery_notes: "",
  });
  const showError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleSubmitForm = async () => {
    if (
      !form.delivery_address ||
      !form.delivery_name ||
      !form.delivery_phone ||
      !form.delivery_state ||
      !form.delivery_lga
    ) {
      showError("Some items are missing. Please complete the form to checkout.");
      return false;
    }

    try {
      const orderDetails: CreateOrderPayload = {
        // The backend calculates delivery_fee_per_unit/delivery_total itself —
        // sending it here is rejected with a validation error.
        items: items.map((item) => ({
          listing_id: item.listing_id,
          quantity: item.quantity,
        })),
        delivery_method: form.delivery_method,
        delivery_name: form.delivery_name,
        delivery_phone: form.delivery_phone,
        delivery_state: form.delivery_state,
        delivery_lga: form.delivery_lga,
        delivery_address: form.delivery_address,
        delivery_notes: form.delivery_notes,
      };
      const order = await createOrder(orderDetails);
      return order;
    } catch (err) {
      showError(getErrorMessage(err));
      return false;
    }
  };

  const updateField =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePay = async () => {
    try {
      setError("");
      const order = await handleSubmitForm();
      if (!order) return;
      const payment = await initializeOrderPayment(order.id);

      const paystack = new Paystack();
      paystack.resumeTransaction(payment.access_code, {
        onSuccess: async () => {
          try {
            const verification = await verifyOrderPayment(order.id);
            if (verification.payment_status !== "paid") {
              showError(
                "We couldn't confirm your payment. Check My Orders shortly, or contact support if you were charged.",
              );
              return;
            }
            clear();
            setSummaryOpen(false);
            navigate("/marketplace/orders");
          } catch (err) {
            showError(getErrorMessage(err));
          }
        },
        onCancel: () => {
          showError("Payment was cancelled.");
        },
        onError: (err: { message: string }) => {
          showError(err?.message || "Payment failed. Please try again.");
        },
      });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  return (
    <BuyerLayout breadcrumb="Marketplace / Checkout">
      <ToastContainer />
      <div className="mx-auto  space-y-6 pb-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Delivery Address
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Where should this order be delivered?
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-primary rounded">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Full Name
              </label>
              <input
                value={form.delivery_name}
                onChange={updateField("delivery_name")}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Phone Number
              </label>
              <input
                value={form.delivery_phone}
                onChange={updateField("delivery_phone")}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                State
              </label>
              <select
                value={form.delivery_state}
                onChange={updateField("delivery_state")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              >
                <option value="">Select state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                LGA
              </label>
              <select
                value={form.delivery_lga}
                onChange={updateField("delivery_lga")}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              >
                <option value="">
                  {form.delivery_state ? "Select LGA" : "Select a state first"}
                </option>
                {(
                  lgasByState[
                    form.delivery_state as keyof typeof lgasByState
                  ] ?? []
                ).map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Delivery Address
              </label>
              <input
                value={form.delivery_address}
                onChange={updateField("delivery_address")}
                placeholder="Enter full address"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Delivery Notes
              </label>
              <textarea
                value={form.delivery_notes}
                onChange={updateField("delivery_notes")}
                rows={2}
                placeholder="e.g. Call on arrival, leave with the security"
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Delivery Method
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose how you'd like to receive your order.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setDeliveryMethod("standard")}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "standard"
                  ? "border-primary bg-global-bg"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Truck className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Standard delivery
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Delivered in 2-4 business days, straight to your doorstep.
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {formatNaira(items.reduce((sum, item) => sum + item.delivery_fee_per_unit * item.quantity, 0))}
                </p>
              </div>
            </button>
            <button
              onClick={() => setDeliveryMethod("pickup")}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "pickup"
                  ? "border-primary bg-global-bg"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Store className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Pickup at depot
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Collect from the nearest depot, within 24 hours.
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">Free</p>
              </div>
            </button>
            <button
              onClick={() => setDeliveryMethod("express")}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                deliveryMethod === "express"
                  ? "border-primary bg-global-bg"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Store className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Express Delivery
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Fast track your delivery , within 24 hours.
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  Extra charges apply
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Payment Method
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            How you'll pay for this order.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You'll pay securely via Paystack. Clicking "Pay with Paystack"
              takes you to Paystack's secure checkout to complete payment. Your
              order is placed once payment is confirmed.
            </p>
          </div>
        </div>

        <button
          disabled={items.length === 0}
          onClick={() => setSummaryOpen(true)}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proceed with Payment
        </button>
      </div>

      <OrderSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onPay={handlePay}
      />
    </BuyerLayout>
  );
}
