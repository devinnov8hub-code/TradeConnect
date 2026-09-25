import { useEffect, useState } from "react";
import {
  CircleCheck,
  Clock,
  Funnel,
  MapPin,
  PackageCheck,
  PackagePlus,
  Truck,
} from "lucide-react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import { type AdminOrderStatusUpdate, type Order } from "../lib/types/order";
import {
  getAllOrders,
  updateOrderStatus,
} from "../lib/services/orders.service";
import { getErrorMessage } from "../lib/getErrorMessage";
import { formatDate } from "../lib/format";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 10;

export default function Orders() {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderNumber = searchParams.get("order");

  const handleUpdateStatus = async (status: AdminOrderStatusUpdate) => {
    if (!selected || updatingStatus) return;

    setUpdatingStatus(true);
    try {
      const updated = await updateOrderStatus(selected.id, status);
      setSelected(updated);
      setOrders((prev) =>
        prev.map((order) => (order.id === updated.id ? updated : order)),
      );
    } catch (error) {
      getErrorMessage(error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const steps = [
    {
      label: "Order Created",
      date: formatDate(selected?.created_at ?? "-"),
      icon: PackagePlus,
    },
    {
      label: "Order Confirmed",
      date: formatDate(selected?.placed_at ?? "-"),
      icon: CircleCheck,
    },
    {
      label: "Processing",
      date: formatDate(selected?.processing_at ?? "-"),
      icon: Clock,
    },
    {
      label: "Out for Delivery",
      date: formatDate(selected?.out_for_delivery_at ?? "-"),
      icon: Truck,
    },
    {
      label: "Delivered",
      date: formatDate(selected?.delivered_at ?? "-"),
      icon: PackageCheck,
    },
  ];

  const activeStep =
    selected?.status === "new"
      ? 1
      : selected?.status === "in_transit"
        ? 3
        : selected?.status === "delivered"
          ? 5
          : 0;

  // Debounce the search box so it doesn't fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const getOrders = async () => {
      try {
        const response = await getAllOrders({
          page,
          per_page: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        setOrders(response.data);
        setTotal(response.meta.total);
        setPageCount(response.meta.last_page || 1);

        const activeOrder =
          selectedOrderNumber !== null
            ? (response.data.find(
                (order) => order.order_number === selectedOrderNumber,
              ) ?? response.data[0])
            : response.data[0];

        setSelected(activeOrder ?? null);

        if (activeOrder && activeOrder.order_number !== selectedOrderNumber) {
          setSearchParams(
            { order: activeOrder.order_number },
            { replace: true },
          );
        }
      } catch (error) {
        getErrorMessage(error);
      }
    };

    getOrders();
  }, [page, debouncedSearch, selectedOrderNumber, setSearchParams]);

  return (
    <Layout breadcrumb="Orders / All orders" compact>
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Order Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Click on any order to preview
            </p>
          </div>
          {selected && (
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selected.status} />
              {selected.status === "new" && (
                <button
                  onClick={() => handleUpdateStatus("in_transit")}
                  disabled={updatingStatus}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus ? "Processing…" : "Process order"}
                </button>
              )}
              {selected.status === "in_transit" && (
                <button
                  onClick={() => handleUpdateStatus("delivered")}
                  disabled={updatingStatus}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus ? "Updating…" : "Mark as delivered"}
                </button>
              )}
              {(selected.status === "new" ||
                selected.status === "in_transit") && (
                <button
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={updatingStatus}
                  className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel order
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-6 rounded-3xl border border-slate-100 bg-global-bg p-6">
          <div className="flex items-center gap-4">
            <Avatar name={selected?.buyer?.name ?? "Buyer"} size="md" />
            <div>
              <p className="font-semibold text-slate-900">
                {selected?.buyer?.name ?? "Buyer"}
              </p>
              <p className="text-xs text-slate-500">{selected?.order_number}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {selected?.farmer?.state} {selected?.farmer?.lga}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm sm:gap-8">
            <div>
              <p className="text-slate-500">PRICE/KG</p>
              <p className="mt-1 font-semibold text-slate-900">
                {selected?.items?.[0]?.unit_price}
              </p>
            </div>
            <div>
              <p className="text-slate-500">QTY</p>
              <p className="mt-1 font-semibold text-slate-900">
                {selected?.quantity}
              </p>
            </div>
            <div>
              <p className="text-slate-500">TOTAL</p>
              <p className="mt-1 font-semibold text-slate-900">
                {selected?.total}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <img
              src={selected?.produce?.image_url}
              alt={selected?.produce?.name}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm"
            />
            <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
              {selected?.produce?.category.name}
            </span>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="flex min-w-150 items-center justify-between px-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const done = idx < activeStep;
              return (
                <div key={step.label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-400">{step.date}</p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        idx < activeStep - 1 ? "bg-primary" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Order Lists
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View all customers orders
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none sm:w-65 sm:flex-none"
            />
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Funnel className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-3 pr-3 font-medium">Order</th>
                <th className="pb-3 pr-3 font-medium">Produce</th>
                <th className="pb-3 pr-3 font-medium">Buyer</th>
                <th className="pb-3 pr-3 font-medium">Qty</th>
                <th className="pb-3 pr-3 font-medium">Total</th>
                <th className="pb-3 pr-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => {
                    setSelected(order);
                    setSearchParams(
                      { order: order.order_number },
                      { replace: true },
                    );
                  }}
                  className={`cursor-pointer border-t border-slate-100 ${
                    selected?.id === order.id
                      ? "bg-global-bg"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-900">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(`${order.placed_at}`)}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.produce?.image_url}
                        alt={order.produce?.name}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-global-bg text-xl"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.produce?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.produce?.category.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>
                      <p className="font-medium text-slate-600">
                        {order.buyer_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.buyer?.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {order.quantity} {order.items?.[0]?.unit}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{order.total}</td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </Layout>
  );
}
