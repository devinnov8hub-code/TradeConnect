import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { formatNaira } from "../lib/format";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Cart Items</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <ShoppingBag className="mb-3 h-10 w-10" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.listing_id}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    onClose();
                    navigate(`/marketplace/produce/${item.listing_id}`);
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.produce_name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover bg-global-bg"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-global-bg text-sm font-semibold text-slate-500">
                      {item.produce_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.produce_name}</p>
                    <p className="text-xs text-slate-400">{item.category_name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-primary">
                      {formatNaira(item.price)}/{item.unit}
                    </p>
                    {item.minimum_order_quantity > 1 && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Min {item.minimum_order_quantity}
                        {item.unit}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-1.5 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updateQty(item.listing_id, item.quantity - 1)}
                      disabled={item.quantity <= item.minimum_order_quantity}
                      className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.listing_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.listing_id);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-medium text-slate-600">Total</p>
              <p className="text-lg font-bold text-slate-900">{formatNaira(subtotal)}</p>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate("/marketplace/checkout");
              }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
